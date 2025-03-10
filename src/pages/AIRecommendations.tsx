import React, { useEffect, useState } from 'react';
import { Calendar, Clock, AlertCircle, ArrowUp, ArrowDown, Info } from 'lucide-react';
import { taskService, projectService, userSettingsService } from '../services/supabaseService';
import { generateDailyTaskSequence } from '../services/openaiService';
import type { Task, Project, UserSettings } from '../types';
import PageContainer from '../components/layout/PageContainer';
import TaskItem from '../components/tasks/TaskItem';

interface SequencedTask extends Task {
  order: number;
}

export default function AIRecommendations() {
  const [tasks, setTasks] = useState<SequencedTask[]>([]);
  const [projects, setProjects] = useState<Record<string, Project>>({});
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [totalTime, setTotalTime] = useState(0);
  const [isOverallocated, setIsOverallocated] = useState(false);
  const [maxDailyHours, setMaxDailyHours] = useState(8); // Default to 8 hours
  
  useEffect(() => {
    fetchData();
  }, []);
  
  useEffect(() => {
    calculateTotalTime();
  }, [tasks]);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const [pendingTasks, allProjects, settings] = await Promise.all([
        taskService.getByStatus('pending'),
        projectService.getAll(),
        userSettingsService.get()
      ]);
      
      // Build projects map for faster lookup
      const projectsMap: Record<string, Project> = {};
      allProjects.forEach(project => {
        projectsMap[project.id] = project;
      });
      setProjects(projectsMap);
      
      // Set user settings if available
      if (settings) {
        setUserSettings(settings);
        // Get max hours from settings if available
        if (settings.workflow && settings.workflow.maxDailyHours) {
          setMaxDailyHours(Number(settings.workflow.maxDailyHours));
        }
      }
      
      // Initial generation of recommendations
      generateRecommendations(pendingTasks, projectsMap, settings);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const generateRecommendations = async (pendingTasks: Task[], projectsMap: Record<string, Project>, settings: UserSettings | null) => {
    try {
      setGenerating(true);
      
      if (pendingTasks.length === 0) {
        setTasks([]);
        setGenerating(false);
        return;
      }
      
      // If we have the OpenAI service implemented, use it
      // Otherwise, fall back to a simple algorithm
      try {
        const sequencedTasks = await generateDailyTaskSequence(pendingTasks, projectsMap, settings);
        setTasks(sequencedTasks.map((task, index) => ({
          ...task,
          order: index + 1
        })));
      } catch (aiErr) {
        console.warn('AI sequencing failed, using fallback algorithm:', aiErr);
        
        // Simple fallback algorithm: prioritize by priority score and due date
        const sorted = [...pendingTasks].sort((a, b) => {
          // First by priority (higher first)
          const priorityDiff = (b.priority_score || 0) - (a.priority_score || 0);
          if (priorityDiff !== 0) return priorityDiff;
          
          // Then by due date (sooner first)
          if (a.due_date && b.due_date) {
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          }
          if (a.due_date) return -1;
          if (b.due_date) return 1;
          
          return 0;
        });
        
        setTasks(sorted.map((task, index) => ({
          ...task,
          order: index + 1
        })));
      }
    } catch (err) {
      setError('Failed to generate recommendations');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };
  
  const calculateTotalTime = () => {
    const total = tasks.reduce((sum, task) => sum + task.estimated_time, 0);
    setTotalTime(total);
    setIsOverallocated(total > maxDailyHours);
  };
  
  const moveTask = (taskId: string, direction: 'up' | 'down') => {
    const index = tasks.findIndex(task => task.id === taskId);
    if (index === -1) return;
    
    if (direction === 'up' && index > 0) {
      const newTasks = [...tasks];
      [newTasks[index - 1], newTasks[index]] = [newTasks[index], newTasks[index - 1]];
      
      // Update order property
      newTasks[index - 1].order = index;
      newTasks[index].order = index + 1;
      
      setTasks(newTasks);
    } else if (direction === 'down' && index < tasks.length - 1) {
      const newTasks = [...tasks];
      [newTasks[index], newTasks[index + 1]] = [newTasks[index + 1], newTasks[index]];
      
      // Update order property
      newTasks[index].order = index + 1;
      newTasks[index + 1].order = index + 2;
      
      setTasks(newTasks);
    }
  };
  
  const handleTaskTimeUpdate = async (taskId: string, actualTime: number) => {
    try {
      // Update the task in the local state
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, actual_time: actualTime } : task
      ));
    } catch (err) {
      console.error('Failed to update task time:', err);
    }
  };
  
  const addToCalendar = () => {
    // This is a placeholder for calendar integration
    alert('Calendar integration will be implemented in a future update.');
  };
  
  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">AI Recommendations</h1>
          <p className="mt-1 text-gray-500">
            Your AI-optimized daily task sequence
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}
        
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                <span>Total: {totalTime.toFixed(1)} hours</span>
              </div>
              
              <div className="flex items-center text-sm">
                <span className="font-medium mr-1">Daily limit:</span>
                <span className={isOverallocated ? "text-red-500" : "text-green-500"}>
                  {maxDailyHours} hours
                </span>
              </div>
              
              {isOverallocated && (
                <div className="flex items-center text-xs text-red-500">
                  <AlertCircle className="w-3.5 h-3.5 mr-1" />
                  <span>Overallocated by {(totalTime - maxDailyHours).toFixed(1)} hours</span>
                </div>
              )}
            </div>
            
            <button
              onClick={addToCalendar}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
            >
              <Calendar className="w-4 h-4 mr-1.5" />
              Add to Calendar
            </button>
          </div>
          
          <div className="p-4 bg-blue-50 text-blue-700 text-sm flex items-start gap-2">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">How tasks are balanced</p>
              <p>
                Tasks are sequenced based on priority scores, deadlines, workflow stages, and project importance.
                The AI considers your skills, work patterns, and goals to create a balanced plan that prevents
                any single project from dominating your day. You can reorder tasks if needed and log actual time
                to help the AI learn your work patterns.
              </p>
            </div>
          </div>
          
          {loading || generating ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-gray-500">
                {loading ? 'Loading tasks...' : 'Generating recommendations...'}
              </span>
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No pending tasks found. Add some tasks to get AI recommendations.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {tasks.map((task) => (
                <div key={task.id} className="p-4 flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-primary/10 text-primary rounded-full font-medium">
                    {task.order}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <TaskItem
                      task={task}
                      project={projects[task.project_id]}
                      hideActions
                      onTimeUpdate={handleTaskTimeUpdate}
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveTask(task.id, 'up')}
                      disabled={task.order === 1}
                      className="p-1 text-gray-400 hover:text-primary disabled:opacity-30 disabled:hover:text-gray-400"
                      aria-label="Move up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveTask(task.id, 'down')}
                      disabled={task.order === tasks.length}
                      className="p-1 text-gray-400 hover:text-primary disabled:opacity-30 disabled:hover:text-gray-400"
                      aria-label="Move down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}