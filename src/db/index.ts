// db/index.ts
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// Support both Neon (POSTGRES_URL) and custom env vars
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

export const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
    })
  : new Pool({
      user: process.env.DB_USER || process.env.POSTGRES_USER || "eventuser",
      host: process.env.DB_HOST || process.env.POSTGRES_HOST || "localhost",
      database:
        process.env.DB_NAME || process.env.POSTGRES_DATABASE || "eventdb",
      password:
        process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || "event123",
      port: parseInt(
        process.env.DB_PORT || process.env.POSTGRES_PORT || "5432",
      ),
    });

// Test connection
pool.connect((err, client, release) => {
  if (err) {
    console.error("!!! Error connecting to the database:", err.stack);
  } else {
    console.log(":> Database connected successfully");
    release();
  }
});
