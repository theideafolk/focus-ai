/*
  # Add Project Documentation Support

  1. Changes
    - Add documentation column to projects table
    - Set default empty JSONB array
    - Add comment explaining the structure

  2. Structure
    documentation JSONB array contains objects with:
    - title: string (document section title)
    - content: string (document content)
*/

ALTER TABLE projects
ADD COLUMN documentation JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN projects.documentation IS 'Array of project documentation entries: [{ title: string, content: string }]';