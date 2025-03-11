/*
  # Add currency column to projects table

  1. Changes
     - Add currency column to projects table to store project-specific currency preference (USD, INR, GBP)
  
  2. Why This Change
     - Projects need to individually store their preferred currency for budget display
     - Supports multiple currency options: USD, INR, and GBP
*/

-- Add currency column to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'currency'
  ) THEN
    ALTER TABLE projects ADD COLUMN currency text;
    
    -- Set default values for existing projects (use USD as default)
    UPDATE projects SET currency = 'USD' WHERE currency IS NULL;
  END IF;
END $$;