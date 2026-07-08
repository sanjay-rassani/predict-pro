-- Add password authentication for app users (Section: user password support)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
