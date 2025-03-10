/*
  # Add task management improvements

  1. Changes
    - Add `stage` column to tasks table for workflow stage tracking
    - Add `actual_time` column to tasks table for time tracking
    - Add `started_at` column to tasks table for tracking when a task is started
    - Add `completed_at` column to tasks table for tracking when a task is completed

  2. Purpose
    These new fields enable better tracking of task progress and improve AI's ability to learn
    from patterns in user's work behavior, particularly regarding time estimates.
*/

-- Add new columns to the tasks table
ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS stage text,
  ADD COLUMN IF NOT EXISTS actual_time numeric,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Update user_settings schema to support more complex workflow structure
DO $$
BEGIN
  -- Only perform the update if the workflow column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_settings' AND column_name = 'workflow'
  ) THEN
    -- This is a no-op migration to document the expected structure
    -- The JSONB column already supports complex objects, we don't need to alter it
    NULL;
  END IF;
END $$;

-- Add comment to document the expected structure
COMMENT ON COLUMN public.user_settings.workflow IS 'Workflow preferences object including: displayName, maxDailyHours, workDays, goals array, and stages array';