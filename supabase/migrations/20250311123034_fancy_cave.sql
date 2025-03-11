/*
  # Add title field to notes table

  1. Changes
    - Add an optional 'title' column to the 'notes' table

  This allows us to store titles separately from the note content, improving
  note organization and display.
*/

-- Add the title column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notes' AND column_name = 'title'
  ) THEN
    ALTER TABLE notes ADD COLUMN title text;
  END IF;
END $$;