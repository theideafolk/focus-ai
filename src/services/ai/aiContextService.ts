import { supabase } from '../../lib/supabase';
import type { AIContext } from '../../types';

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

export default aiContextService;