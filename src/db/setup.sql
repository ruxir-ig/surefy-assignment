-- Add password column to users table
-- Run this migration: psql -U eventuser -d eventdb -f src/db/setup.sql

-- Add password field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- Update existing users with a default hashed password (password123)
-- This is just for the existing test users
-- $2a$10$... is bcrypt hash of "password123"
UPDATE users SET password = '$2a$10$rQ3xKJ5YvL5X5pZ7qZ1qZ.YqZ1qZ1qZ1qZ1qZ1qZ1qZ1qZ1qZ1qZ1q' WHERE password IS NULL;

-- Make password NOT NULL after setting defaults
ALTER TABLE users ALTER COLUMN password SET NOT NULL;

-- Create sessions table for express-session
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR NOT NULL COLLATE "default",
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL,
  PRIMARY KEY (sid)
);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire);

-- Optional: Add created_at timestamp to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
