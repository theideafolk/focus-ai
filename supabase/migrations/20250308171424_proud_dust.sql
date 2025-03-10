/*
  # Fix Project RLS Policies

  1. Changes
    - Drop existing policies that are causing issues
    - Create new policies with correct user_id checks
    - Ensure authenticated users can only access their own projects

  2. Security
    - Enable RLS on projects table
    - Add policies for CRUD operations
    - All policies check auth.uid() matches user_id
*/

-- First enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;

-- Create new policies
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
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
ON projects FOR DELETE
TO authenticated
USING (auth.uid() = user_id);