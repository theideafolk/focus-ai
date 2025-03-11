/*
  # Add Documents Storage Bucket

  1. New Features
    - Create a storage bucket for project documents
    - Enables document storage functionality for the application
  
  2. Changes
    - Creates a new storage bucket called 'project-documents'
    - Sets the bucket to public access for easier document sharing
*/

-- Create a new bucket for project documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-documents', 'project-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Note: Policies for the bucket need to be configured through the Supabase dashboard
-- The original migration attempted to create policies directly, but the storage.policies
-- table structure differs in this Supabase environment