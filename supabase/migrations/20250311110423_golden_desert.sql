/*
  # Fix User Registration RLS Policies

  1. Changes
    - Add RLS policies that explicitly allow new users to create their own settings
    - Ensure authenticated users can properly insert user_settings records
  
  This migration adds the necessary RLS policies to fix user registration issues
  where new users couldn't create their initial settings.
*/

-- Make sure we have the proper RLS policy for user_settings insertions
DO $$ 
BEGIN
  -- Check if the policy already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_settings' 
    AND policyname = 'Users can insert their own settings'
  ) THEN
    -- Create the policy if it doesn't exist
    CREATE POLICY "Users can insert their own settings"
      ON public.user_settings
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- Make sure RLS is enabled on user_settings
ALTER TABLE IF EXISTS public.user_settings ENABLE ROW LEVEL SECURITY;

-- Check and fix other policies if needed
DO $$ 
BEGIN
  -- Check if these policies exist and create them if they don't
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
      USING (auth.uid() = user_id);
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