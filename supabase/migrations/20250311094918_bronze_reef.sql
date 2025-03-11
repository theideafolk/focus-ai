/*
  # Update Projects Table for Document Management

  1. Changes
    - Modify projects.documentation field to handle the new document format
    - Add documents field to store document metadata in projects table
    - The new field uses JSONB type to allow flexible document metadata storage
*/

-- Add documents field to projects table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'documents'
  ) THEN
    ALTER TABLE projects ADD COLUMN documents JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add comment explaining the documents field structure
COMMENT ON COLUMN projects.documents IS 'Array of project documents with metadata: [{id, title, description, fileName, fileUrl, fileType, fileSize, category, customCategory, uploadedAt, version, tags}]';