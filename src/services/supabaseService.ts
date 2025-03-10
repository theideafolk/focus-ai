import { supabase } from '../lib/supabase';
import type { Project, Note, Task, UserSettings, AIContext } from '../types';

// Projects
export const projectService = {
  async create(project: Partial<Project>) {
    // Get the current user ID and add it to the project
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('projects')
      .insert({ ...project, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getAll() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Project>) {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

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
    if (error) throw error;
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
    if (error) throw error;
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

// Tasks
export const taskService = {
  async create(task: Partial<Task>) {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getAll() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('priority_score', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getByProject(projectId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('due_date', { ascending: true });
    if (error) throw error;
    return data;
  },

  async getByStatus(status: Task['status']) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', status)
      .order('priority_score', { ascending: false });
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Task>) {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateActualTime(id: string, actualTime: number) {
    const { data, error } = await supabase
      .from('tasks')
      .update({ actual_time: actualTime })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateStatus(id: string, status: Task['status']) {
    // Also record timestamps based on status changes
    const updates: Partial<Task> = { status };
    
    if (status === 'in_progress' && !updates.started_at) {
      updates.started_at = new Date().toISOString();
    } else if (status === 'completed' && !updates.completed_at) {
      updates.completed_at = new Date().toISOString();
    }
    
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// User Settings
export const userSettingsService = {
  async get() {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .single();
    if (error && error.code !== 'PGRST116') throw error; // Ignore not found error
    return data;
  },

  async upsert(settings: Partial<UserSettings>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        ...settings,
        user_id: user.id
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

// AI Context
export const aiContextService = {
  async get() {
    const { data, error } = await supabase
      .from('ai_context')
      .select('*')
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async update(context: Partial<AIContext>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('ai_context')
      .upsert({
        ...context,
        user_id: user.id
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};