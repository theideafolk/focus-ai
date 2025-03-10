/*
  # Fix project user_id handling

  1. Changes
    - Ensure proper handling of user_id in projects table
    - Update RLS policies to properly check authenticated user
  
  2. Security
    - Reinforcing RLS policies for the projects table
    - Ensuring users can only access their own projects
*/

-- Make sure RLS is enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them with correct conditions
DROP POLICY IF EXISTS "Users can create their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;

-- Create proper policies
CREATE POLICY "Users can create their own projects"
ON projects FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own projects"
ON projects FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
ON projects FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
ON projects FOR DELETE
TO authenticated
USING (auth.uid() = user_id);