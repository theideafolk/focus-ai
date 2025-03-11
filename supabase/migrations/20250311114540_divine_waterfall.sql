/*
  # Fix Row Level Security Policies

  1. Changes
     - Clarify and strengthen the tasks table RLS policy
     - Add explicit USING and WITH CHECK clauses to tasks policy
     - Ensure proper format for all policies across tables
     - Add explicit grants for authenticated users

  This migration addresses database permission issues that were causing
  "Failed to save tasks" errors by ensuring authenticated users can
  properly create, read, update and delete their tasks.
*/

-- Ensure Row Level Security is enabled on tasks table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing tasks policies to avoid conflicts
DROP POLICY IF EXISTS "Users can CRUD tasks in their projects" ON public.tasks;

-- Create more explicit policies for tasks with both USING and WITH CHECK clauses
CREATE POLICY "Users can view tasks in their projects"
ON public.tasks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM projects
    WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create tasks in their projects"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM projects
    WHERE projects.id = project_id AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update tasks in their projects"
ON public.tasks
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM projects
    WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM projects
    WHERE projects.id = project_id AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete tasks in their projects"
ON public.tasks
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM projects
    WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid()
  )
);

-- Verify projects RLS policies
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Verify notes RLS policies
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Ensure other tables have RLS enabled
ALTER TABLE public.notes_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_context ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes_embeddings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_context TO authenticated;