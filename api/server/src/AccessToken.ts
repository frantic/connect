import {
  APIError,
  APIErrorCode,
  AccessToken,
  AccountID,
} from "@connect/api-client";
import jwt from "jsonwebtoken";

/**
 * The secret we use to sign our JSON Web Tokens (JWT). In development and test
 * environments we use the super secret “`secret`” token. In production we need
 * a real secret from our environment variables.
 */
export const JWT_SECRET: string = (() => {
  if (__DEV__ || __TEST__) {
    return "secret";
  } else if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  } else {
    throw new Error("JWT secret is not configured.");
  }
})();

/**
 * The data carried around in an access token.
 */
export type AccessTokenData = {
  /**
   * The identifier of the account that is authorized to interact with our API.
   */
  readonly id: AccountID;
};

/**
 * Responsible for generating and verifying access tokens for our API.
 */
export const AccessTokenGenerator = {
  /**
   * Generates an access token using the provided data.
   *
   * **DANGER DANGER DANGER:** All access tokens generated by this method are
   * trusted! You must must _must_ first verify that you are only ever
   * generating an access token for the true owner of an account.
   *
   * If an attacker gets their hands on an access token they have full access to
   * the account until the access token expires.
   */
  async generate(data: AccessTokenData): Promise<AccessToken> {
    const accessToken = await new Promise<string>((resolve, reject) => {
      jwt.sign(data, JWT_SECRET, {expiresIn: "1h"}, (error, accessToken) => {
        if (error) reject(error);
        else resolve(accessToken);
      });
    });
    return accessToken as AccessToken;
  },

  /**
   * Verifies that a string is, indeed, an access token **and** that an access
   * token was generated by our API and no one else.
   *
   * If we fail to verify the access token then we will throw an `APIError` with
   * an unauthorized error code.
   */
  async verify(accessToken: string): Promise<AccessTokenData> {
    const accessTokenData = await new Promise<any>((resolve, reject) => {
      jwt.verify(accessToken, JWT_SECRET, (error, accessTokenData) => {
        if (error) {
          // We want to throw an API error instead of a JWT error. So convert
          // to the proper error here.
          if (error instanceof jwt.TokenExpiredError) {
            reject(new APIError(APIErrorCode.ACCESS_TOKEN_EXPIRED));
          } else {
            reject(new APIError(APIErrorCode.UNAUTHORIZED));
          }
        } else {
          resolve(accessTokenData);
        }
      });
    });
    return accessTokenData;
  },

  /**
   * Attempts to decodes an access token to its JSON payload. This will not
   * verify that the access token has an acceptable signature! Do not use this
   * for cases where it is critical that we know the access token was generated
   * by us.
   */
  dangerouslyDecodeWithoutVerifying(
    accessToken: string,
  ): AccessTokenData | null {
    return jwt.decode(accessToken) as any;
  },
};
