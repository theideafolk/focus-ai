import React, { useEffect, useState } from 'react';
import { Filter, CheckCircle2, Calendar, Plus, Clock, ArrowDown, ArrowUp, Edit } from 'lucide-react';
import { taskService, projectService, userSettingsService } from '../services/supabaseService';
import { learnFromTaskCompletion } from '../services/openaiService';
import type { Task, Project, UserSettings } from '../types';
import PageContainer from '../components/layout/PageContainer';
import TaskList from '../components/tasks/TaskList';
import TaskForm from '../components/tasks/TaskForm';
import GenerateTasksForm from '../components/tasks/GenerateTasksForm';

type FilterType = 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled';
type SortType = 'due_date' | 'priority' | 'estimated_time';

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsMap, setProjectsMap] = useState<Record<string, Project>>({});
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterType>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortType>('priority');
  const [isGenerateFormOpen, setIsGenerateFormOpen] = useState(false);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  const [totalEstimatedTime, setTotalEstimatedTime] = useState(0);
  const [maxDailyHours, setMaxDailyHours] = useState(8); // Default to 8 hours
  
  useEffect(() => {
    fetchData();
  }, []);
  
  useEffect(() => {
    applyFiltersAndSort();
  }, [tasks, statusFilter, projectFilter, stageFilter, sortBy]);
  
  useEffect(() => {
    const map: Record<string, Project> = {};
    projects.forEach(project => {
      map[project.id] = project;
    });
    setProjectsMap(map);
  }, [projects]);
  
  useEffect(() => {
    if (userSettings?.workflow?.stages) {
      // Extract stage names from user settings
      const stageNames = userSettings.workflow.stages.map((stage: any) => stage.name);
      setStages(stageNames);
    }
    
    // Set max daily hours from user settings
    if (userSettings?.workflow?.maxDailyHours) {
      setMaxDailyHours(Number(userSettings.workflow.maxDailyHours));
    }
  }, [userSettings]);
  
  // Calculate total estimated time of filtered tasks
  useEffect(() => {
    const pendingTasks = filteredTasks.filter(task => 
      task.status === 'pending' || task.status === 'in_progress'
    );
    const total = pendingTasks.reduce((sum, task) => sum + task.estimated_time, 0);
    setTotalEstimatedTime(total);
  }, [filteredTasks]);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const [allTasks, allProjects, settings] = await Promise.all([
        taskService.getAll(),
        projectService.getAll(),
        userSettingsService.get()
      ]);
      setTasks(allTasks);
      setProjects(allProjects);
      setUserSettings(settings);
    } catch (err) {
      setError('Failed to load tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const applyFiltersAndSort = () => {
    let filtered = [...tasks];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }
    
    // Apply project filter
    if (projectFilter !== 'all') {
      filtered = filtered.filter(task => task.project_id === projectFilter);
    }
    
    // Apply stage filter
    if (stageFilter !== 'all') {
      filtered = filtered.filter(task => task.stage === stageFilter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'due_date') {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      
      if (sortBy === 'priority') {
        const aPriority = a.priority_score || 0;
        const bPriority = b.priority_score || 0;
        return bPriority - aPriority; // Higher priority first
      }
      
      if (sortBy === 'estimated_time') {
        return a.estimated_time - b.estimated_time;
      }
      
      return 0;
    });
    
    setFilteredTasks(filtered);
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
  
  const handleTaskDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await taskService.delete(taskId);
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };
  
  const handleTaskTimeUpdate = async (taskId: string, actualTime: number) => {
    try {
      // Update the actual time in the database
      await learnFromTaskCompletion(taskId, actualTime);
      
      // Update the local state
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, actual_time: actualTime } : task
      ));
    } catch (err) {
      console.error('Failed to update task time:', err);
    }
  };
  
  const handleTasksGenerated = (newTasks: Task[]) => {
    setTasks([...newTasks, ...tasks]);
    setIsGenerateFormOpen(false);
  };
  
  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setIsTaskFormOpen(true);
  };
  
  const handleCreateTask = () => {
    setSelectedTask(undefined);
    setIsTaskFormOpen(true);
  };
  
  const handleTaskFormSubmit = async (taskData: Partial<Task>) => {
    try {
      if (selectedTask?.id) {
        // Update existing task
        const updatedTask = await taskService.update(selectedTask.id, taskData);
        setTasks(tasks.map(task => 
          task.id === updatedTask.id ? updatedTask : task
        ));
      } else {
        // Create new task
        const newTask = await taskService.create(taskData);
        setTasks([newTask, ...tasks]);
      }
    } catch (err) {
      throw new Error('Failed to save task');
    }
  };
  
  const moveTask = async (index: number, direction: 'up' | 'down') => {
    if (filteredTasks.length <= 1) return;
    
    if (direction === 'up' && index > 0) {
      const newTasks = [...filteredTasks];
      [newTasks[index - 1], newTasks[index]] = [newTasks[index], newTasks[index - 1]];
      
      // Update priority scores to reflect the new order
      const lowerPriority = newTasks[index].priority_score || 0;
      const higherPriority = newTasks[index - 1].priority_score || 0;
      
      // Swap priorities
      await Promise.all([
        taskService.update(newTasks[index - 1].id, { priority_score: higherPriority }),
        taskService.update(newTasks[index].id, { priority_score: lowerPriority })
      ]);
      
      // Update local state
      setTasks(tasks.map(task => {
        if (task.id === newTasks[index - 1].id) {
          return { ...task, priority_score: higherPriority };
        }
        if (task.id === newTasks[index].id) {
          return { ...task, priority_score: lowerPriority };
        }
        return task;
      }));
      
    } else if (direction === 'down' && index < filteredTasks.length - 1) {
      const newTasks = [...filteredTasks];
      [newTasks[index], newTasks[index + 1]] = [newTasks[index + 1], newTasks[index]];
      
      // Update priority scores to reflect the new order
      const lowerPriority = newTasks[index].priority_score || 0;
      const higherPriority = newTasks[index + 1].priority_score || 0;
      
      // Swap priorities
      await Promise.all([
        taskService.update(newTasks[index].id, { priority_score: lowerPriority }),
        taskService.update(newTasks[index + 1].id, { priority_score: higherPriority })
      ]);
      
      // Update local state
      setTasks(tasks.map(task => {
        if (task.id === newTasks[index].id) {
          return { ...task, priority_score: lowerPriority };
        }
        if (task.id === newTasks[index + 1].id) {
          return { ...task, priority_score: higherPriority };
        }
        return task;
      }));
    }
  };
  
  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-medium text-gray-900">Tasks</h1>
            <p className="mt-1 text-gray-500">
              Manage and track tasks across all your projects
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreateTask}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-700 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </button>
            <button
              onClick={() => setIsGenerateFormOpen(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4 mr-2" />
              Generate Tasks
            </button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}
        
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4">
            <div className="flex items-center">
              <label htmlFor="status-filter" className="text-sm text-gray-500 mr-2 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Status:
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FilterType)}
                className="text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <label htmlFor="project-filter" className="text-sm text-gray-500 mr-2 flex items-center">
                <Filter className="w-4 h-4 mr-1" />
                Project:
              </label>
              <select
                id="project-filter"
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              >
                <option value="all">All Projects</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
            
            {stages.length > 0 && (
              <div className="flex items-center">
                <label htmlFor="stage-filter" className="text-sm text-gray-500 mr-2 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Stage:
                </label>
                <select
                  id="stage-filter"
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                >
                  <option value="all">All Stages</option>
                  {stages.map(stage => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="flex items-center">
              <label htmlFor="sort-by" className="text-sm text-gray-500 mr-2 flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Sort by:
              </label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              >
                <option value="priority">Priority</option>
                <option value="due_date">Due Date</option>
                <option value="estimated_time">Time Estimate</option>
              </select>
            </div>
            
            {/* Show total estimated time */}
            <div className="flex items-center ml-auto">
              <span className="text-sm flex items-center">
                <Clock className="w-4 h-4 mr-1 text-gray-500" />
                <span className="text-gray-500 mr-1">Total:</span>
                <span className={`font-medium ${totalEstimatedTime > maxDailyHours ? 'text-red-500' : 'text-green-600'}`}>
                  {totalEstimatedTime.toFixed(1)}h
                </span>
                <span className="text-gray-500 mx-1">/</span>
                <span className="text-gray-500">{maxDailyHours}h</span>
              </span>
            </div>
          </div>
          
          {/* Task list with reordering capability */}
          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading tasks...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-500">No tasks found</p>
              </div>
            ) : (
              filteredTasks.map((task, index) => (
                <div key={task.id} className="p-4 flex items-start gap-4">
                  {/* Task reordering buttons (integrated from AI Focus page) */}
                  <div className="flex flex-col gap-1 mt-2">
                    <button
                      onClick={() => moveTask(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-primary disabled:opacity-30 disabled:hover:text-gray-400"
                      aria-label="Move up"
                      title="Move task up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveTask(index, 'down')}
                      disabled={index === filteredTasks.length - 1}
                      className="p-1 text-gray-400 hover:text-primary disabled:opacity-30 disabled:hover:text-gray-400"
                      aria-label="Move down"
                      title="Move task down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex-1">
                    <TaskList
                      tasks={[task]}
                      projects={projectsMap}
                      onStatusChange={handleTaskStatusChange}
                      onDelete={handleTaskDelete}
                      onTimeUpdate={handleTaskTimeUpdate}
                      onEdit={handleEdit}
                      hideListStyling={true}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      <GenerateTasksForm
        isOpen={isGenerateFormOpen}
        onClose={() => setIsGenerateFormOpen(false)}
        projects={projects}
        onTasksGenerated={handleTasksGenerated}
      />
      
      <TaskForm
        task={selectedTask}
        isOpen={isTaskFormOpen}
        onClose={() => setIsTaskFormOpen(false)}
        onSubmit={handleTaskFormSubmit}
        allowProjectChange={true}
      />
    </PageContainer>
  );
}