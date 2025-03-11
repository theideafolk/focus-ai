/*
  # Fix User Settings Workflow Structure

  1. Changes
     - Add a migration to ensure user_settings.workflow JSONB structure is properly maintained
     - Update workflow schema to support goals, stages, and other user preferences correctly
  
  2. Purpose
     - Fixes an issue where saved goals and other workflow preferences were not being retrieved correctly
     - Ensures proper JSON structure in the database
*/

-- Helper function to ensure all user_settings have properly structured workflow field
CREATE OR REPLACE FUNCTION ensure_user_settings_workflow_structure()
RETURNS VOID AS $$
BEGIN
  -- Update any user_settings with null workflow to empty object
  UPDATE user_settings 
  SET workflow = '{}'::jsonb 
  WHERE workflow IS NULL;
  
  -- Ensure goals array exists in workflow
  UPDATE user_settings
  SET workflow = workflow || '{"goals":[]}'::jsonb
  WHERE workflow -> 'goals' IS NULL;
  
  -- Ensure stages array exists in workflow
  UPDATE user_settings
  SET workflow = workflow || '{"stages":[]}'::jsonb
  WHERE workflow -> 'stages' IS NULL;
  
  -- Ensure workDays array exists in workflow (default to Mon-Fri)
  UPDATE user_settings
  SET workflow = workflow || '{"workDays":[1,2,3,4,5]}'::jsonb
  WHERE workflow -> 'workDays' IS NULL;
  
  -- Ensure maxDailyHours exists in workflow (default to 8)
  UPDATE user_settings
  SET workflow = workflow || '{"maxDailyHours":8}'::jsonb
  WHERE workflow -> 'maxDailyHours' IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to update existing records
SELECT ensure_user_settings_workflow_structure();