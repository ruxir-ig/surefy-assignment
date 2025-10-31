import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// Use a single DATABASE_URL for serverless environments (e.g., Vercel + Neon)
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  // Minimal pool for serverless: keep connections low and timeouts short
  max: 1,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

// Important: Do not eagerly connect here. In serverless environments,
// connections are established lazily on the first query using this pool.
