import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { userSettingsService } from '../services/supabaseService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null,
  session: null,
  loading: true,
  signOut: async () => {} 
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // If this is a new sign-in with OAuth, ensure user settings exist
      if (session?.user && session.user.app_metadata.provider !== 'email') {
        ensureUserSettings(session.user);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Handle new OAuth users
      if (session?.user && _event === 'SIGNED_IN' && session.user.app_metadata.provider !== 'email') {
        ensureUserSettings(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Ensure user settings exist for OAuth users
  const ensureUserSettings = async (user: User) => {
    try {
      // Check if user settings already exist
      const settings = await userSettingsService.get();
      
      // If no settings exist, create initial settings
      if (!settings) {
        console.log('Creating initial settings for OAuth user');
        await userSettingsService.upsert({
          skills: [],
          workflow: {
            displayName: user.user_metadata.full_name || '',
            maxDailyHours: 8,
            workDays: [1, 2, 3, 4, 5], // Monday to Friday
            goals: [],
            stages: []
          },
          time_estimates: {}
        });
      }
    } catch (error) {
      console.error('Error ensuring user settings:', error);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      // Clear any stored paths when signing out
      sessionStorage.removeItem('initialPath');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);