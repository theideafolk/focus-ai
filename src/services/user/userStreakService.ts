import { supabase } from '../../lib/supabase';

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

export default userStreakService;