import React from 'react';
import { User } from '@supabase/supabase-js';

interface UserProfileSettingsProps {
  user: User | null;
  displayName: string;
  onDisplayNameChange: (displayName: string) => void;
}

export default function UserProfileSettings({ 
  user, 
  displayName, 
  onDisplayNameChange 
}: UserProfileSettingsProps) {
  return (
    <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">User Profile</h2>
        <p className="mt-1 text-sm text-gray-500">
          Your personal information
        </p>
      </div>
      
      <div className="p-6">
        <div className="max-w-lg">
          {user?.user_metadata?.full_name && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <p className="text-gray-900">{user.user_metadata.full_name}</p>
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <p className="text-gray-900">{user?.email}</p>
          </div>
          
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => onDisplayNameChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              placeholder="Your name"
            />
            <p className="mt-1 text-xs text-gray-500">
              This name will be used throughout the app
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}