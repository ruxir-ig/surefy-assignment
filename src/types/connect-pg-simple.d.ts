/**
 * Minimal TypeScript declarations for the `connect-pg-simple` package.
 * This is sufficient for typing default import usage and constructor options
 * without depending on external @types packages.
 */

declare module "connect-pg-simple" {
  import type { Store } from "express-session";
  import type { Pool, PoolConfig } from "pg";

  interface ConnectPgSimpleOptions {
    pool?: Pool;
    conString?: string;
    conObject?: PoolConfig;
    tableName?: string;
    schemaName?: string;
    ttl?: number;
    pruneSessionInterval?: number | false;
    pruneSessionRandomFactor?: number;
    errorLog?: (...args: any[]) => void;
    createTableIfMissing?: boolean;
    disableTouch?: boolean;
  }

  interface PGStoreConstructor {
    new (options?: ConnectPgSimpleOptions): Store;
  }

  /**
   * Default export: a function that takes the `express-session` module
   * and returns a session store constructor compatible with it.
   *
   * Usage:
   *   import ConnectPgSimple from "connect-pg-simple";
   *   const PgSession = ConnectPgSimple(session);
   *   app.use(session({ store: new PgSession({ pool }) }));
   */
  function ConnectPgSimple(session: any): PGStoreConstructor;

  export default ConnectPgSimple;
}
