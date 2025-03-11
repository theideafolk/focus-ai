/*
  # Simplified User Registration Solution

  1. Changes
     - Create a reliable database-level trigger to create user settings
     - Ensure proper permissions and constraints
     - Remove client-side complexity

  This approach moves user settings creation to the database layer,
  making it automatic and reliable regardless of client-side code.
*/

-- First, ensure we have the update_updated_at function
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at') THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
    ';
  END IF;
END
$$;

-- Create a function that will reliably create user settings when a user is created
CREATE OR REPLACE FUNCTION public.create_user_settings_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (
    user_id, 
    skills, 
    time_estimates, 
    workflow
  ) VALUES (
    NEW.id, 
    '[]'::jsonb, 
    '{}'::jsonb,
    jsonb_build_object(
      'displayName', '', 
      'maxDailyHours', 8,
      'workDays', ARRAY[1, 2, 3, 4, 5],
      'preferredCurrency', 'USD',
      'stages', '[]'::jsonb,
      'goals', '[]'::jsonb
    )
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the existing trigger if it exists to avoid duplicates
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger on auth.users table
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_user_settings_on_signup();

-- Make sure Row Level Security is enabled
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can CRUD their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;

-- Create clear, comprehensive policies
CREATE POLICY "Users can view their own settings"
ON public.user_settings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
ON public.user_settings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
ON public.user_settings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings"
ON public.user_settings
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO authenticated;