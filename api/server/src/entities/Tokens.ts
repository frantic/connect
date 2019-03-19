import {AccessToken, AccountID, RefreshToken} from "@connect/api-client";
import {JWT_SECRET, TEST} from "../RunConfig";
import jwt from "jsonwebtoken";
import uuidV4 from "uuid/v4";

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
   */
  async verify(accessToken: string): Promise<AccessTokenData> {
    const accessTokenData = await new Promise<any>((resolve, reject) => {
      jwt.verify(accessToken, JWT_SECRET, (error, accessTokenData) => {
        if (error) reject(error);
        else resolve(accessTokenData);
      });
    });
    return accessTokenData;
  },
};

/**
 * Manages the creation and usage of refresh tokens.
 */
export interface RefreshTokenCollection {
  /**
   * Creates a new refresh token for the provided account.
   */
  generate(id: AccountID): Promise<RefreshToken>;

  /**
   * Mark a refresh token as used and return the account that the refresh token
   * is for. If no such refresh token exists then return undefined.
   */
  use(token: RefreshToken): Promise<AccountID | undefined>;

  /**
   * Destroys a refresh token so that it may never be used to generate a new
   * access token again!
   */
  destroy(token: RefreshToken): Promise<void>;
}

export class MockRefreshTokenCollection implements RefreshTokenCollection {
  private readonly refreshTokens = new Map<RefreshToken, AccountID>();

  constructor() {
    if (!TEST) {
      throw new Error("Cannot use mocks outside of a test environment.");
    }
  }

  async generate(id: AccountID): Promise<RefreshToken> {
    const refreshToken = uuidV4() as RefreshToken;
    this.refreshTokens.set(refreshToken, id);
    return refreshToken;
  }

  async use(token: RefreshToken): Promise<AccountID | undefined> {
    return this.refreshTokens.get(token);
  }

  async destroy(token: RefreshToken): Promise<void> {
    this.refreshTokens.delete(token);
  }
}