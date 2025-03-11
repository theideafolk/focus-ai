import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { userSettingsService, userStreakService } from '../services/supabaseService';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        // Simple sign up - no extra logic needed
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (signUpError) {
          console.error('Sign up error:', signUpError);
          throw signUpError;
        }
        
        // User settings will be created automatically by the database trigger
      } else {
        // Simple sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) {
          console.error('Sign in error:', signInError);
          throw signInError;
        }
        
        // Update user streak on successful login
        await userStreakService.updateStreak();
      }

      // Check if there's a saved path to redirect to
      const savedPath = sessionStorage.getItem('initialPath');
      if (savedPath && savedPath !== '/login' && savedPath !== '/') {
        navigate(savedPath);
        sessionStorage.removeItem('initialPath');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      // User-friendly error messages
      let errorMessage = 'An error occurred';
      
      if (err instanceof Error) {
        console.error('Authentication error details:', err);
        
        if (err.message.includes('invalid_credentials')) {
          errorMessage = 'Invalid email or password. Please try again.';
        } else if (err.message.includes('already registered')) {
          errorMessage = 'This email is already registered. Please sign in instead.';
        } else if (err.message.includes('password')) {
          errorMessage = 'Password should be at least 6 characters.';
        } else if (err.message.includes('Database error')) {
          errorMessage = 'Registration error. Please try again or contact support.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-center text-gray-900">
            focus
          </h1>
          <p className="mt-2 text-center text-gray-600">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleAuth}>
          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}
          
          <div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              placeholder="Email address"
            />
          </div>

          <div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              placeholder="Password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {loading
              ? isSignUp
                ? 'Creating account...'
                : 'Signing in...'
              : isSignUp
                ? 'Create account'
                : 'Sign in'
            }
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-primary hover:text-primary-dark transition-colors"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}