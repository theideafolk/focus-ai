/*
  # Ensure User Settings are Created on Signup

  1. Changes
     - Add trigger to automatically create user_settings when a user signs up
     - This ensures each user has exactly one settings record
  
  2. Purpose
     - Prevents duplicate key errors when updating settings
     - Makes settings management more reliable
*/

-- Function to create user settings when a new user signs up
CREATE OR REPLACE FUNCTION create_user_settings_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Create initial empty settings for the new user
  INSERT INTO public.user_settings (user_id, skills, time_estimates, workflow)
  VALUES (
    NEW.id, 
    '[]'::jsonb,
    '{}'::jsonb,
    '{
      "goals": [],
      "stages": [],
      "workDays": [1,2,3,4,5],
      "maxDailyHours": 8
    }'::jsonb
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_user_settings_on_signup();