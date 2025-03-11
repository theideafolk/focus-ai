import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Briefcase, FileText, Settings, CheckCircle, LogOut, Brain } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const { signOut } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;
  
  const links = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/projects', icon: Briefcase, label: 'Projects' },
    { path: '/tasks', icon: CheckCircle, label: 'Tasks' },
    { path: '/notes', icon: FileText, label: 'Notes' },
    { path: '/insights', icon: Brain, label: 'Insights' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-semibold text-primary">focus AI</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-4 md:space-x-6 lg:space-x-8">
              {links.map(({ path, icon: Icon, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    isActive(path)
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex items-center">
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 hover:text-primary transition-colors"
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="grid grid-cols-6 h-16">
          {links.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center ${
                isActive(path) ? 'text-primary' : 'text-gray-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs mt-1 truncate w-full text-center px-1">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}