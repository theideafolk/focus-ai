import { supabase } from '../../lib/supabase';
import type { Note } from '../../types';

// Notes with vector search
export const noteService = {
  async create(note: Partial<Note>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('notes')
      .insert({ ...note, user_id: user.id })
      .select()
      .single();
    if (error) {
      console.error('Error creating note:', error);
      throw error;
    }
    return data;
  },

  async getAll() {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getByProject(projectId: string) {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Note>) {
    const { data, error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('Error updating note:', error);
      throw error;
    }
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async searchSimilar(content: string, limit = 5) {
    // This is just a placeholder that won't be directly used
    // The actual vector similarity search is handled in the openaiService
    return [];
  }
};

export default noteService;