import { supabase } from '../../lib/supabase';
import type { UserSettings } from '../../types';

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

export default userSettingsService;