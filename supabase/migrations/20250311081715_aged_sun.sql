/*
  # Add Project Fields

  1. New Fields
    - `project_type` (text, nullable)
    - `project_type_other` (text, nullable)
    - `user_priority` (integer, default: 3)
    - `complexity` (text, default: 'medium')
    - `is_recurring` (boolean, default: false)

  2. Changes
    - Add check constraint for project_type values
    - Add check constraint for complexity values
    - Add check constraint for user_priority range
*/

-- Add new fields to projects table with safe checks
DO $$
BEGIN
  -- Add project_type field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'project_type'
  ) THEN
    ALTER TABLE projects ADD COLUMN project_type text;
  END IF;

  -- Add project_type_other field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'project_type_other'
  ) THEN
    ALTER TABLE projects ADD COLUMN project_type_other text;
  END IF;

  -- Add user_priority field with default value
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'user_priority'
  ) THEN
    ALTER TABLE projects ADD COLUMN user_priority integer DEFAULT 3;
  END IF;

  -- Add complexity field with default value
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'complexity'
  ) THEN
    ALTER TABLE projects ADD COLUMN complexity text DEFAULT 'medium';
  END IF;

  -- Add is_recurring field with default value
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'is_recurring'
  ) THEN
    ALTER TABLE projects ADD COLUMN is_recurring boolean DEFAULT false;
  END IF;

  -- Add check constraints if they don't exist yet
  -- For project_type values
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'projects' AND constraint_name = 'valid_project_type'
  ) THEN
    ALTER TABLE projects ADD CONSTRAINT valid_project_type 
      CHECK (project_type IS NULL OR project_type IN (
        'retainer', 'mvp', 'landing_page', 'website', 
        'content_creation', 'content_strategy', 'other'
      ));
  END IF;

  -- For complexity values
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'projects' AND constraint_name = 'valid_complexity'
  ) THEN
    ALTER TABLE projects ADD CONSTRAINT valid_complexity 
      CHECK (complexity IS NULL OR complexity IN ('easy', 'medium', 'hard'));
  END IF;

  -- For user_priority range
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'projects' AND constraint_name = 'valid_user_priority'
  ) THEN
    ALTER TABLE projects ADD CONSTRAINT valid_user_priority 
      CHECK (user_priority >= 1 AND user_priority <= 5);
  END IF;
END $$;