const http = require("http");
const {parse: parseUrl} = require("url");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const chalk = require("chalk");
const next = require("next");

// The port our web server will be listening on.
const port = process.env.PORT || 3000;

// Are we in production?
const dev = process.env.NODE_ENV !== "production";

// Create our Next.js app
const app = next({dev});
const handle = app.getRequestHandler();

async function run() {
  // Wait for Next.js to do its preparation stuff.
  await app.prepare();

  // Create our HTTP server. We want to proxy all requests to `/api` to our
  // actual API. We proxy all requests through a server so that we can keep our
  // client secret, well, secret. We’re also able to put our access tokens in
  // cookies out of reach from malicious client side scripts.
  const server = http.createServer((request, response) => {
    // Parse the url.
    const url = parseUrl(request.url, true);

    // If the client is trying to make an API request...
    if (request.method === "POST" && url.pathname.startsWith("/api")) {
      apiProxy(request, response, url.pathname.slice(4));
      return;
    }

    // Let Next.js handle everything else.
    handle(request, response, url);
  });

  // Start listening to requests on our provided port.
  server.listen(port, error => {
    if (error) throw error;

    // eslint-disable-next-line no-console
    console.log(
      `${chalk.grey("▸")} Ready on ` +
        `${chalk.bold.underline(`http://localhost:${port}`)}`,
    );
  });
}

// Call main and promote any uncaught promise exceptions to uncaught
// JS exceptions.
run().catch(error => {
  setImmediate(() => {
    throw error;
  });
});

/**
 * The URL of our API on the internet! We will proxy post requests on `/api` for
 * our server to this URL.
 *
 * TODO: Make this configurable
 */
const apiUrl = parseUrl("http://localhost:4000");

/**
 * Proxy these headers when calling our API.
 *
 * All headers are in lowercase for easy matching.
 */
const apiProxyHeaders = new Set([
  "content-type",
  "content-length",
  "accept-encoding",
]);

/**
 * Our API proxy agent will keep alive TCP connections so we don’t have to keep
 * reconnecting them.
 */
const apiProxyAgent = new http.Agent({keepAlive: true});

/**
 * A token cookie lives for 100 years. We have other mechanisms of expiring and
 * invalidating tokens besides cookie expiration.
 */
const tokenCookieMaxAge = 60 * 60 * 24 * 365 * 100;

/**
 * The cookie settings for a refresh token.
 */
const refreshTokenCookieSettings = {
  path: "/api",
  httpOnly: true,
  secure: !dev,
  sameSite: "strict",
  maxAge: tokenCookieMaxAge,
};

/**
 * The cookie settings for an access token.
 */
const accessTokenCookieSettings = {
  path: "/api",
  httpOnly: true,
  secure: !dev,
  sameSite: "strict",
  maxAge: tokenCookieMaxAge,
};

/**
 * Proxies a POST request to our API.
 *
 * Adds special handling for authorization. When signing in we will attach our
 * tokens to a cookie. Future requests will use those cookies to authorize us
 * with the API.
 */
function apiProxy(request, response, pathname) {
  // We first try to parse the access and refresh tokens from our cookie. If
  // the access token has expired then we try to refresh it before sending
  // our request.
  let accessToken;
  let refreshToken;

  // Parse the access token and refresh token from the request cookies.
  const cookieHeader = request.headers.cookie;
  if (cookieHeader !== undefined) {
    try {
      // Parse our cookie header.
      const result = cookie.parse(cookieHeader);
      accessToken = result.access_token;
      refreshToken = result.refresh_token;

      // If the access token has expired then we need to generate a new access
      // token! We refresh the token even if the token will only expire in 30
      // seconds. That’s to factor in network latency. We want to avoid the
      // token expiring while in flight to our API server.
      if (Math.floor(Date.now() / 1000) >= jwt.decode(accessToken).exp - 30) {
        refreshAccessToken();
      } else {
        // Otherwise our access token did not expire and we can send
        // our request.
        sendRequest();
      }
    } catch (error) {
      sendUnknownError();
    }
  } else {
    // If we do not have a cookie header then send our request on its way!
    sendRequest();
  }

  /**
   * Sends the request we are proxying to our API server. We might have to
   * refresh our access token before we can proxy a request.
   */
  function sendRequest() {
    // Options for the HTTP request to our proxy.
    const proxyRequestOptions = {
      protocol: apiUrl.protocol,
      hostname: apiUrl.hostname,
      port: apiUrl.port,
      agent: apiProxyAgent,
      method: "POST",
      path: pathname,
    };

    // Make the request.
    const proxyRequest = http.request(proxyRequestOptions, handleResponse);

    // Copy headers we’re ok with proxying to our request options.
    for (let i = 0; i < request.rawHeaders.length; i += 2) {
      const header = request.rawHeaders[i];
      if (apiProxyHeaders.has(header.toLowerCase())) {
        proxyRequest.setHeader(header, request.rawHeaders[i + 1]);
      }
    }

    // Add an authorization header with our access token (from a cookie) to the
    // API request.
    if (accessToken !== undefined) {
      proxyRequest.setHeader("Authorization", `Bearer ${accessToken}`);
    }

    // If this is a “sign in” or a “sign up” request then we’ll be intercepting
    // the API response body so make sure the response is not compressed.
    if (pathname === "/account/signIn" || pathname === "/account/signUp") {
      proxyRequest.removeHeader("Accept-Encoding");
    }

    // Pipe the body we received into the proxy request body.
    request.pipe(proxyRequest);
  }

  /**
   * When we get a response pipe it to our actual HTTP response so our browser
   * can use it.
   */
  function handleResponse(proxyResponse) {
    if (pathname === "/account/signIn" || pathname === "/account/signUp") {
      handleNewTokensResponse(proxyResponse);
    } else {
      // Copy the status code and headers from our proxy response.
      response.statusCode = proxyResponse.statusCode;
      for (let i = 0; i < proxyResponse.rawHeaders.length; i += 2) {
        response.setHeader(
          proxyResponse.rawHeaders[i],
          proxyResponse.rawHeaders[i + 1],
        );
      }

      // Send the body to our actual response.
      proxyResponse.pipe(response);
    }
  }

  /**
   * Handles new tokens being returned by our API. We store these tokens in
   * browser cookies.
   */
  function handleNewTokensResponse(proxyResponse) {
    readStream(proxyResponse, result => {
      try {
        // Parse our response body as JSON.
        result = JSON.parse(result);

        // If the API result was not ok then send it as-is to the client.
        if (!result.ok) {
          response.statusCode = proxyResponse.statusCode;
          response.setHeader("Content-Type", "application/json");
          response.write(JSON.stringify(result));
          response.end();
          return;
        }

        // Set our refresh token and access token as secure cookies. HTTP-only
        // is very important here as it avoids XSS security vulnerabilities!
        //
        // Since refresh tokens are very dangerous in the wrong hands we also
        // force the cookie to only be sent over secure contexts.
        response.setHeader("Set-Cookie", [
          cookie.serialize(
            "refresh_token",
            result.data.refreshToken,
            refreshTokenCookieSettings,
          ),
          cookie.serialize(
            "access_token",
            result.data.accessToken,
            accessTokenCookieSettings,
          ),
        ]);

        // Send an ok response to our client. We remove the refresh and access
        // tokens from the response body so that client-side code will never
        // have access to them.
        response.statusCode = 200;
        response.setHeader("Content-Type", "application/json");
        response.write(
          JSON.stringify({
            ok: true,
            data: {
              refreshToken: "",
              accessToken: "",
            },
          }),
        );
        response.end();
      } catch (error) {
        sendUnknownError();
      }
    });
  }

  /**
   * Generates a new access token before sending our request.
   */
  function refreshAccessToken() {
    // Send a request to refresh our token.
    const refreshRequest = http.request(
      {
        protocol: apiUrl.protocol,
        hostname: apiUrl.hostname,
        port: apiUrl.port,
        agent: apiProxyAgent,
        method: "POST",
        path: "/account/refreshAccessToken",
        headers: {"Content-Type": "application/json"},
      },
      handleRefreshResponse,
    );

    // Set the refresh token as the method input.
    refreshRequest.write(JSON.stringify({refreshToken}));
    refreshRequest.end();

    function handleRefreshResponse(refreshResponse) {
      readStream(refreshResponse, result => {
        try {
          // Parse our refresh request response...
          result = JSON.parse(result);
          if (!result.ok) {
            throw new Error("Expected a successful API response.");
          }

          // Retrieve the new access token.
          const newAccessToken = result.data.accessToken;

          // Set our cookie with the updated access token. This way we won’t
          // need to generate an access token for every request. We can use
          // this one for the next hour or so.
          response.setHeader(
            "Set-Cookie",
            cookie.serialize(
              "access_token",
              newAccessToken,
              accessTokenCookieSettings,
            ),
          );

          // Set the access token in our closure to the new access token.
          accessToken = newAccessToken;
        } catch (error) {
          sendUnknownError();
          return;
        }

        // Yay! Now that we have a non-expired access token we can actually send
        // our API request.
        sendRequest();
      });
    }
  }

  /**
   * Reads the response from a Node.js stream as a string. If it fails we call
   * `sendUnknownError()` without calling our callback.
   */
  function readStream(stream, callback) {
    let result = "";
    let error = false;

    // We want to get strings from `.on("data")` so set the encoding to UTF-8.
    stream.setEncoding("utf8");

    // Add our checks to `data` as we get them.
    stream.on("data", chunk => {
      result += chunk;
    });

    // If we encounter an error then send that error down to our client.
    stream.on("error", () => {
      error = true;
      sendUnknownError();
    });

    // Yay! We have all the data. Now we can parse it and set our cookies.
    stream.on("end", () => {
      // Only call our callback if there was no error!
      if (!error) {
        callback(result);
      }
    });
  }

  /**
   * Utility for sending an API error with an `UNKNOWN` error code.
   */
  function sendUnknownError() {
    response.statusCode = 500;
    response.setHeader("Content-Type", "application/json");
    response.write(
      JSON.stringify({
        ok: false,
        error: {code: "UNKNOWN"},
      }),
    );
    response.end();
  }
}
