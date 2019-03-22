import {SQLQuery, sql} from "./PGSQL";
import {AccountID} from "@connect/api-client";
import {PGClient} from "./PGClient";
import {QueryResult} from "pg";
import createDebugger from "debug";

const debug = createDebugger("connect:api:pg");

/**
 * A context that can be queried.
 */
export interface ContextQueryable {
  /**
   * Executes a SQL query. We require a `SQLQuery` object to prevent SQL
   * injection attacks entirely.
   */
  query(query: SQLQuery): Promise<QueryResult>;
}

/**
 * Context for an unauthorized API request.
 */
export class ContextUnauthorized implements ContextQueryable {
  /**
   * Run an asynchronous action in an unauthorized context.
   */
  static withUnauthorized<T>(
    action: (ctx: ContextUnauthorized) => Promise<T>,
  ): Promise<T> {
    return PGClient.with(async client => {
      const ctx = new ContextUnauthorized(client);
      try {
        return await action(ctx);
      } finally {
        ctx.invalidate();
      }
    });
  }

  /**
   * The Postgres client our context uses to execute database queries. The
   * client is private. It may not be accessed by the outside world. Instead
   * if you have a `Context` object you should call the `query()` method which
   * requires a `SQLQuery` and performs debug logging.
   *
   * When the context is done being used we set the client to `undefined` which
   * stops the programmer from making any more queries with this context. This
   * prevents accidental leaks where the context is returned in some way by the
   * transaction it was scoped to.
   */
  private client: PGClient | undefined;

  protected constructor(client: PGClient) {
    this.client = client;
  }

  /**
   * Executes a SQL query. We require a `SQLQuery` object to prevent SQL
   * injection attacks entirely. We will also log the provided query
   * for debugging.
   */
  query(query: SQLQuery): Promise<QueryResult> {
    if (this.client === undefined) {
      throw new Error("Cannot query a context after it has been invalidated.");
    }
    const queryConfig = sql.compile(query);
    debug(typeof queryConfig === "string" ? queryConfig : queryConfig.text);
    return this.client.query(queryConfig);
  }

  /**
   * Invalidates a context which prevents it from being used. This is useful for
   * stopping leaks where the programmer accidentally returns the context from
   * their transaction.
   */
  protected invalidate() {
    this.client = undefined;
  }
}

/**
 * Context for an authorized API request.
 */
export class Context extends ContextUnauthorized {
  /**
   * Run an asynchronous action in an authorized context.
   */
  static withAuthorized<T>(
    accountID: AccountID,
    action: (ctx: Context) => Promise<T>,
  ): Promise<T> {
    return PGClient.with(async client => {
      // Set the account ID database parameter in our authenticated context
      // before running the action. We first verify that `accountID` is, indeed,
      // a number to avoid SQL injection attacks. Then we insert it directly
      // into the query.
      //
      // We use the underlying client from the `pg` module to avoid logging this
      // query which runs on every authorized API request.
      if (typeof accountID === "number") {
        await client.query(`SET LOCAL connect.account_id = ${accountID}`);
      } else {
        throw new Error("Expected accountID to be a number.");
      }

      // Create our context. We will invalidate it after the action returns.
      const ctx = new Context(client, accountID);
      try {
        return await action(ctx);
      } finally {
        ctx.invalidate();
      }
    });
  }

  /**
   * The ID of the authenticated account.
   */
  public readonly accountID: AccountID;

  protected constructor(client: PGClient, accountID: AccountID) {
    super(client);
    this.accountID = accountID;
  }
}
