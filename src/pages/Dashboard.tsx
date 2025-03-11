import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { projectService, taskService, userSettingsService } from '../services/supabaseService';
import type { Project, Task, UserSettings } from '../types';
import PageContainer from '../components/layout/PageContainer';
import ProjectCard from '../components/dashboard/ProjectCard';
import TaskList from '../components/dashboard/TaskList';
import { Plus, LightbulbIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import GenerateTasksForm from '../components/tasks/GenerateTasksForm';

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isGenerateTasksFormOpen, setIsGenerateTasksFormOpen] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [preferredCurrency, setPreferredCurrency] = useState<'USD' | 'INR' | 'GBP'>('USD');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [projectsData, tasksData, settings] = await Promise.all([
        projectService.getAll(),
        taskService.getByStatus('pending'),
        userSettingsService.get(),
      ]);

      // Sort projects by priority
      const sortedProjects = [...projectsData].sort((a, b) => 
        (b.priority_score || 0) - (a.priority_score || 0)
      );
      
      setProjects(sortedProjects.slice(0, 3)); // Show top 3 projects by priority
      
      // Get today's tasks or upcoming tasks
      const today = new Date().toISOString().split('T')[0];
      const upcomingTasks = tasksData
        .filter(task => !task.due_date || task.due_date >= today)
        .sort((a, b) => {
          // First by due date
          if (a.due_date && b.due_date) {
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          }
          if (a.due_date) return -1;
          if (b.due_date) return 1;
          
          // Then by priority
          return (b.priority_score || 0) - (a.priority_score || 0);
        })
        .slice(0, 5); // Just show top 5 upcoming tasks
        
      setTasks(upcomingTasks);
      
      // Set user settings and preferred currency
      if (settings) {
        setUserSettings(settings);
        if (settings.workflow?.preferredCurrency) {
          setPreferredCurrency(settings.workflow.preferredCurrency);
        }
      }
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskStatusChange = async (taskId: string, status: Task['status']) => {
    try {
      await taskService.updateStatus(taskId, status);
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status } : task
      ));
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };
  
  const handleTasksGenerated = (newTasks: Task[]) => {
    // Refresh task list after generation
    fetchTasks();
    setIsGenerateTasksFormOpen(false);
  };
  
  const fetchTasks = async () => {
    try {
      const tasksData = await taskService.getByStatus('pending');
      
      // Get today's tasks or upcoming tasks
      const today = new Date().toISOString().split('T')[0];
      const upcomingTasks = tasksData
        .filter(task => !task.due_date || task.due_date >= today)
        .sort((a, b) => {
          // First by due date
          if (a.due_date && b.due_date) {
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          }
          if (a.due_date) return -1;
          if (b.due_date) return 1;
          
          // Then by priority
          return (b.priority_score || 0) - (a.priority_score || 0);
        })
        .slice(0, 5); // Just show top 5 upcoming tasks
        
      setTasks(upcomingTasks);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  };
  
  // Add focus listener to refresh data when tab gets focus (like when returning from project edit)
  useEffect(() => {
    const handleFocus = () => {
      fetchDashboardData();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-2xl font-medium text-gray-900">
            Welcome back, {user?.email?.split('@')[0]}
          </h1>
          <p className="mt-1 text-gray-500">
            Here's your focus for today
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          </div>
        ) : (
          <>
            {/* Top Projects Section */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  Top Priority Projects
                </h2>
                <Link 
                  to="/projects"
                  className="text-sm text-primary hover:text-primary-dark"
                >
                  View all
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map(project => (
                  <ProjectCard 
                    key={project.id} 
                    project={project}
                    preferredCurrency={preferredCurrency}
                  />
                ))}
                {projects.length === 0 && (
                  <p className="text-gray-500 col-span-full py-4 text-center">
                    No projects yet. Create your first project to get started.
                  </p>
                )}
              </div>
            </section>

            {/* Tasks Section */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  Today's Tasks
                </h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsGenerateTasksFormOpen(true)}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Generate Tasks
                  </button>
                  <Link
                    to="/ai-recommendations"
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
                  >
                    <LightbulbIcon className="w-4 h-4 mr-1.5" />
                    AI Focus Planner
                  </Link>
                </div>
              </div>
              <TaskList
                tasks={tasks}
                onStatusChange={handleTaskStatusChange}
              />
            </section>
          </>
        )}
      </div>
      
      <GenerateTasksForm
        isOpen={isGenerateTasksFormOpen}
        onClose={() => setIsGenerateTasksFormOpen(false)}
        projects={projects}
        onTasksGenerated={handleTasksGenerated}
      />
    </PageContainer>
  );
}