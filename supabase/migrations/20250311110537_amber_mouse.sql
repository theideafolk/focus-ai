/*
  # Fix User Registration Database Error

  1. Changes
    - Create a trigger function to automatically create user settings on signup
    - Add proper RLS policies for user_settings table
    - Ensure auth.users can properly insert into user_settings

  This migration fixes the "Database error saving new user" issue by automating
  user settings creation directly in the database rather than relying on client-side code.
*/

-- First, create a function that will be triggered when a new user signs up
CREATE OR REPLACE FUNCTION public.create_user_settings_on_signup()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_settings (user_id, skills, time_estimates, workflow)
  VALUES (
    NEW.id, 
    '[]'::jsonb, 
    '{}'::jsonb,
    jsonb_build_object(
      'maxDailyHours', 8,
      'workDays', '[1, 2, 3, 4, 5]',
      'preferredCurrency', 'USD',
      'stages', '[]',
      'goals', '[]'
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if the trigger already exists and create it if not
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'create_user_settings_after_user_create'
  ) THEN
    -- Create the trigger on auth.users
    CREATE TRIGGER create_user_settings_after_user_create
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_user_settings_on_signup();
  END IF;
END
$$;

-- Make sure we have the proper RLS policies for user_settings
DO $$ 
BEGIN
  -- Enable RLS on user_settings table if not already enabled
  ALTER TABLE IF EXISTS public.user_settings ENABLE ROW LEVEL SECURITY;

  -- Create policies if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_settings' 
    AND policyname = 'Users can view their own settings'
  ) THEN
    CREATE POLICY "Users can view their own settings"
      ON public.user_settings
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_settings' 
    AND policyname = 'Users can update their own settings'
  ) THEN
    CREATE POLICY "Users can update their own settings"
      ON public.user_settings
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_settings' 
    AND policyname = 'Users can insert their own settings'
  ) THEN
    CREATE POLICY "Users can insert their own settings"
      ON public.user_settings
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_settings' 
    AND policyname = 'Users can delete their own settings'
  ) THEN
    CREATE POLICY "Users can delete their own settings"
      ON public.user_settings
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Ensure foreign key constraints are properly set
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_settings_user_id_fkey'
  ) THEN
    -- Add foreign key constraint if missing
    ALTER TABLE public.user_settings
    ADD CONSTRAINT user_settings_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END
$$;