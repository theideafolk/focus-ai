/*
  # Add Documents Storage Bucket

  1. New Features
    - Create a storage bucket for project documents
    - Set up appropriate permissions for document uploads and access
    - Enable public access to documents

  2. Security
    - Only authenticated users can upload documents
    - Documents are public for viewing
*/

-- Create a new bucket for project documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-documents', 'project-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to the project-documents bucket
DO $$
BEGIN
  -- Allow authenticated users to upload files
  INSERT INTO storage.policies (name, bucket_id, operation, definition, role)
  VALUES (
    'Project Documents Upload Policy',
    'project-documents',
    'INSERT',
    '(auth.uid() IS NOT NULL)',
    'authenticated'
  )
  ON CONFLICT (name, bucket_id, operation) DO NOTHING;

  -- Allow authenticated users to update their files
  INSERT INTO storage.policies (name, bucket_id, operation, definition, role)
  VALUES (
    'Project Documents Update Policy',
    'project-documents',
    'UPDATE',
    '(auth.uid() IS NOT NULL)',
    'authenticated'
  )
  ON CONFLICT (name, bucket_id, operation) DO NOTHING;

  -- Allow authenticated users to delete their files
  INSERT INTO storage.policies (name, bucket_id, operation, definition, role)
  VALUES (
    'Project Documents Delete Policy',
    'project-documents',
    'DELETE',
    '(auth.uid() IS NOT NULL)',
    'authenticated'
  )
  ON CONFLICT (name, bucket_id, operation) DO NOTHING;

  -- Allow anyone to read files
  INSERT INTO storage.policies (name, bucket_id, operation, definition, role)
  VALUES (
    'Project Documents Read Policy',
    'project-documents',
    'SELECT',
    '(true)',
    'anon'
  )
  ON CONFLICT (name, bucket_id, operation) DO NOTHING;
END $$;