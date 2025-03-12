/*
  # Add note tagging system

  1. Changes
    - Add auto_tags JSONB array to store AI-generated tags
    - Add user_tags JSONB array to store user-defined tags
    - Add tag_metadata JSONB to store tag confidence scores and context
  
  2. Purpose
    - Enable automatic note categorization
    - Allow user customization of tags
    - Store metadata about tag generation
*/

-- Add new columns to notes table
ALTER TABLE notes
ADD COLUMN IF NOT EXISTS auto_tags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS user_tags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS tag_metadata JSONB DEFAULT '{}'::jsonb;

-- Add comment explaining the structure
COMMENT ON COLUMN notes.auto_tags IS 'AI-generated tags: ["to-do", "project-context", etc]';
COMMENT ON COLUMN notes.user_tags IS 'User-defined tags: ["important", "follow-up", etc]';
COMMENT ON COLUMN notes.tag_metadata IS 'Metadata about tags: {"confidence": 0.9, "generated_at": timestamp}';

-- Create an index for tag search
CREATE INDEX IF NOT EXISTS idx_notes_auto_tags ON notes USING gin (auto_tags);
CREATE INDEX IF NOT EXISTS idx_notes_user_tags ON notes USING gin (user_tags);