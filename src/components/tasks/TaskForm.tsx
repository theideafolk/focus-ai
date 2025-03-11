import React, { useState, useEffect } from 'react';
import { X, Calendar, CheckCircle, Tag, Clock } from 'lucide-react';
import { projectService, userSettingsService } from '../../services/supabaseService';
import type { Task, Project, UserSettings } from '../../types';

interface TaskFormProps {
  task?: Task;
  projectId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: Partial<Task>) => Promise<void>;
  allowProjectChange?: boolean;
}

export default function TaskForm({ 
  task, 
  projectId, 
  isOpen, 
  onClose, 
  onSubmit, 
  allowProjectChange = false 
}: TaskFormProps) {
  const [formData, setFormData] = useState<Partial<Task>>({
    description: '',
    estimated_time: 1,
    due_date: '',
    status: 'pending',
    project_id: projectId || '',
    priority_score: 5,
    stage: '',
  });
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Fetch projects and user settings for workflow stages
  useEffect(() => {
    if (isOpen) {
      fetchProjects();
      fetchUserSettings();
    }
  }, [isOpen]);
  
  // Initialize form data when editing an existing task
  useEffect(() => {
    if (task) {
      setFormData({
        description: task.description || '',
        estimated_time: task.estimated_time || 1,
        due_date: task.due_date || '',
        status: task.status || 'pending',
        project_id: task.project_id || '',
        priority_score: task.priority_score || 5,
        stage: task.stage || '',
      });
    } else {
      // Reset form when creating a new task
      setFormData({
        description: '',
        estimated_time: 1,
        due_date: '',
        status: 'pending',
        project_id: projectId || '',
        priority_score: 5,
        stage: '',
      });
    }
  }, [task, projectId, isOpen]);
  
  const fetchProjects = async () => {
    try {
      const projectsData = await projectService.getAll();
      setProjects(projectsData);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };
  
  const fetchUserSettings = async () => {
    try {
      const settings = await userSettingsService.get();
      if (settings?.workflow?.stages) {
        const stageNames = settings.workflow.stages.map((stage: any) => stage.name);
        setStages(stageNames);
      }
    } catch (err) {
      console.error('Failed to load user settings:', err);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-medium text-gray-900">
            {task ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Task Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Task Description *
            </label>
            <textarea
              id="description"
              required
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              placeholder="Describe the task..."
            />
          </div>

          {/* Project Selection */}
          {allowProjectChange && (
            <div>
              <label htmlFor="project_id" className="block text-sm font-medium text-gray-700 mb-1">
                Project *
              </label>
              <select
                id="project_id"
                required
                value={formData.project_id || ''}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status, Stage and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1 text-gray-500" />
                Status
              </label>
              <select
                id="status"
                value={formData.status || 'pending'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Task['status'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            {/* Stage */}
            <div>
              <label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Tag className="w-4 h-4 mr-1 text-gray-500" />
                Stage
              </label>
              <select
                id="stage"
                value={formData.stage || ''}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              >
                <option value="">No stage</option>
                {stages.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Priority */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority (1-10)
              </label>
              <input
                type="number"
                id="priority"
                min="1"
                max="10"
                value={formData.priority_score || 5}
                onChange={(e) => setFormData({ ...formData, priority_score: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Time and Due Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Estimated Time */}
            <div>
              <label htmlFor="estimated_time" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Clock className="w-4 h-4 mr-1 text-gray-500" />
                Estimated Time (hours) *
              </label>
              <input
                type="number"
                id="estimated_time"
                required
                min="0.1"
                step="0.1"
                value={formData.estimated_time || ''}
                onChange={(e) => setFormData({ ...formData, estimated_time: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
            
            {/* Due Date */}
            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Calendar className="w-4 h-4 mr-1 text-gray-500" />
                Due Date
              </label>
              <input
                type="date"
                id="due_date"
                value={formData.due_date || ''}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}