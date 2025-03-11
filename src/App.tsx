import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Notes from './pages/Notes';
import Tasks from './pages/Tasks';
import Settings from './pages/Settings';
import Insights from './pages/Insights';
import './index.css';

// This component will handle the redirect logic
const RedirectHandler = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Handle initial page load
    const initialPath = sessionStorage.getItem('initialPath');
    
    if (!loading) {
      if (user) {
        // If user is authenticated and we have a stored path, navigate to it
        if (initialPath && initialPath !== '/' && initialPath !== '/login') {
          sessionStorage.removeItem('initialPath');
          navigate(initialPath);
        }
      }
    }
  }, [loading, user, navigate]);

  // On first render, store the requested path if it's not the root or login
  useEffect(() => {
    if (location.pathname !== '/' && location.pathname !== '/login' && !sessionStorage.getItem('initialPath')) {
      sessionStorage.setItem('initialPath', location.pathname);
    }
  }, []);

  return <>{children}</>;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <RedirectHandler>
          <div className="min-h-screen">
            <Routes>
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
              <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} />
              <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
              <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />
              <Route
                path="/"
                element={
                  <PublicRoute>
                    <Navigate to="/login" replace />
                  </PublicRoute>
                }
              />
              {/* Catch-all route - redirect to dashboard if authenticated, login if not */}
              <Route
                path="*"
                element={
                  <ProtectedRoute>
                    <Navigate to="/dashboard" replace />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </RedirectHandler>
      </Router>
    </AuthProvider>
  );
}

export default App;