import { supabase } from '../../lib/supabase';
import type { Task } from '../../types';

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

export default taskService;