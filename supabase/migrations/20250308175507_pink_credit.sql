/*
  # Add vector similarity search functions

  1. New Functions
    - `match_notes` - Returns notes similar to a given vector embedding
  
  2. Details
    - This function enables semantic search using pgvector
    - It calculates cosine similarity between note embeddings and query vector
    - Returns notes ordered by similarity with a configurable threshold

  Note: This requires the pgvector extension to be enabled in your Supabase project
*/

-- Create a function for matching notes based on vector similarity
CREATE OR REPLACE FUNCTION match_notes(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    notes.id,
    notes.content,
    1 - (notes_embeddings.embedding <=> query_embedding) AS similarity
  FROM
    notes
  INNER JOIN
    notes_embeddings ON notes.id = notes_embeddings.note_id
  WHERE
    -- Only include rows where the current user owns the note
    auth.uid() = notes.user_id
    -- Filter for embeddings with a similarity above the threshold
    AND 1 - (notes_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY
    notes_embeddings.embedding <=> query_embedding
  LIMIT
    match_count;
END;
$$;