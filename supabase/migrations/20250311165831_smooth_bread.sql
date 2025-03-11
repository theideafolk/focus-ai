/*
  # Add streak tracking fields to auth.users table
  
  1. New Fields
     - `streak_count` (integer) - Tracks consecutive daily logins
     - `last_login_date` (timestamptz) - Records the last login date for streak calculation
  
  2. Default Values
     - Set default streak_count to 0
     - Set last_login_date to null initially
*/

-- Add streak count field (defaults to 0)
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0;

-- Add last login date field
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS last_login_date TIMESTAMPTZ DEFAULT NULL;

-- Create an index on last_login_date for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_last_login_date ON auth.users(last_login_date);