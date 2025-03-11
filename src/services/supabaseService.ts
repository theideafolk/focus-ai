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

// Tasks
export const taskService = {
  async create(task: Partial<Task>) {
    // Add logging to help debug task creation issues
    console.log('Creating task:', task);
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert(task)
        .select()
        .single();
      
      if (error) {
        console.error('Failed to create task:', error);
        throw error;
      }
      
      console.log('Task created successfully:', data);
      return data;
    } catch (err) {
      console.error('Task creation error:', err);
      throw err;
    }
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
    if (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
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
  },
  
  async batchDelete(ids: string[]) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .in('id', ids);
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
    
    try {
      // First, check if the user already has settings
      const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .single();

      // Clone the settings to avoid reference issues
      const settingsToUpsert = JSON.parse(JSON.stringify({
        ...settings,
        user_id: user.id
      }));
      
      let result;
      
      if (existingSettings) {
        // If settings exist, update them
        console.log('Updating existing settings with ID:', existingSettings.id);
        const { data, error } = await supabase
          .from('user_settings')
          .update(settingsToUpsert)
          .eq('id', existingSettings.id)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
      } else {
        // If no settings exist, insert new ones
        console.log('Creating new settings for user:', user.id);
        const { data, error } = await supabase
          .from('user_settings')
          .insert(settingsToUpsert)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
      }
      
      return result;
    } catch (error) {
      console.error('Error upserting settings:', error);
      throw error;
    }
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

// User streak service
export const userStreakService = {
  async getStreak() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      
      // Get streak count from user metadata
      return user.user_metadata?.streak_count || 0;
    } catch (err) {
      console.error('Error retrieving streak:', err);
      return 0;
    }
  },
  
  async updateStreak() {
    try {
      // Get current user and metadata
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      
      // Current date at midnight (to compare days properly)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Initialize variables from user metadata
      const metadata = user.user_metadata || {};
      let streak = metadata.streak_count || 0;
      const lastLoginDate = metadata.last_login_date ? new Date(metadata.last_login_date) : null;
      
      if (lastLoginDate) {
        // Set to midnight for proper day comparison
        lastLoginDate.setHours(0, 0, 0, 0);
        
        // Calculate days difference
        const timeDifference = today.getTime() - lastLoginDate.getTime();
        const daysDifference = Math.floor(timeDifference / (1000 * 3600 * 24));
        
        if (daysDifference === 1) {
          // Consecutive day login - increment streak
          streak++;
        } else if (daysDifference > 1) {
          // Missed a day - reset streak to 1
          streak = 1;
        } else if (daysDifference === 0) {
          // Same day login - keep current streak (don't increment)
        }
      } else {
        // First login - start streak at 1
        streak = 1;
      }
      
      // Update streak in user metadata
      const { data, error } = await supabase.auth.updateUser({
        data: {
          streak_count: streak,
          last_login_date: today.toISOString()
        }
      });
      
      if (error) {
        console.error('Error updating user streak:', error);
        return 0;
      }
      
      return streak;
    } catch (err) {
      console.error('Error updating streak:', err);
      return 0;
    }
  }
};