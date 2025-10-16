// db/index.ts
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  user: process.env.DB_USER || 'eventuser',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'eventdb',
  password: process.env.DB_PASSWORD || 'event123',
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Test connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('!!! Error connecting to the database:', err.stack);
  } else {
    console.log(':> Database connected successfully');
    release();
  }
});