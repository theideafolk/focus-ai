/*
  # Fix Projects RLS Policies

  1. Changes
    - Drop existing RLS policy that's causing issues
    - Create new policies for each operation (SELECT, INSERT, UPDATE, DELETE)
    - Ensure users can only access their own projects
    - Add policy for authenticated users only

  2. Security
    - Enable RLS on projects table (in case it's not enabled)
    - Restrict access to authenticated users only
    - Users can only access projects where they are the owner (user_id matches)
*/

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can CRUD their own projects" ON projects;

-- Create separate policies for each operation
CREATE POLICY "Users can view their own projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);