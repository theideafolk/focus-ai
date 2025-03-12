import { supabase } from '../../lib/supabase';
import type { Note } from '../../types';

// Replace with your actual OpenAI API key and endpoint
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const OPENAI_API_URL_EMBEDDINGS = 'https://api.openai.com/v1/embeddings';

/**
 * Processes text to prepare it for embedding generation
 */
export function processTextForEmbedding(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')  // Replace multiple spaces with a single space
    .slice(0, 8000);       // Truncate to a reasonable length for the embedding model
}

/**
 * Generates embeddings for the given text using OpenAI API
 */
export async function generateEmbeddings(text: string): Promise<number[]> {
  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API key is not set. Skipping embedding generation.');
    return [];
  }

  try {
    const response = await fetch(OPENAI_API_URL_EMBEDDINGS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        input: processTextForEmbedding(text),
        model: 'text-embedding-ada-002'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw new Error('Failed to generate embeddings');
  }
}

/**
 * Creates or updates the embedding for a note
 */
export async function storeNoteEmbedding(note: Note): Promise<void> {
  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API key is not set. Skipping embedding storage.');
    return;
  }

  try {
    const embedding = await generateEmbeddings(note.content);
    
    if (embedding.length === 0) {
      console.warn('Empty embedding generated. Skipping storage.');
      return;
    }

    // Check if an embedding already exists for this note
    const { data: existingEmbedding } = await supabase
      .from('notes_embeddings')
      .select('id')
      .eq('note_id', note.id)
      .maybeSingle();

    if (existingEmbedding) {
      // Update existing embedding
      const { error } = await supabase
        .from('notes_embeddings')
        .update({ embedding, updated_at: new Date().toISOString() })
        .eq('note_id', note.id);
      
      if (error) throw error;
    } else {
      // Create new embedding
      const { error } = await supabase
        .from('notes_embeddings')
        .insert({
          note_id: note.id,
          embedding
        });
      
      if (error) throw error;
    }
  } catch (error) {
    console.error('Error storing note embedding:', error);
  }
}

/**
 * Searches for notes similar to the given query
 */
export async function searchSimilarNotes(query: string, limit = 5): Promise<string[]> {
  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API key is not set. Skipping similarity search.');
    return [];
  }

  try {
    const embedding = await generateEmbeddings(query);
    
    if (embedding.length === 0) {
      return [];
    }

    // Try to use the match_notes RPC function
    try {
      const { data, error } = await supabase.rpc('match_notes', {
        query_embedding: embedding,
        match_threshold: 0.5,
        match_count: limit
      });

      if (error) {
        // If the function doesn't exist or there's another error, log it and return empty array
        console.warn('Vector search not available yet:', error.message);
        return [];
      }
      
      // If we got data successfully, return the note IDs
      if (data && Array.isArray(data)) {
        return data.map((item: any) => item.id);
      }
      
      return [];
    } catch (rpcError) {
      console.warn('Fallback to text search only:', rpcError);
      return [];
    }
  } catch (error) {
    console.error('Error searching similar notes:', error);
    return [];
  }
}

export default {
  processTextForEmbedding,
  generateEmbeddings,
  storeNoteEmbedding,
  searchSimilarNotes
};