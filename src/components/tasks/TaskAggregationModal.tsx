import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle2, Clock, Calendar } from 'lucide-react';
import type { Task, Project } from '../../types';

interface TaskAggregationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTasks: Task[];
  onAggregate: (newTask: Partial<Task>, tasksToRemove: string[]) => Promise<void>;
  projects: Record<string, Project>;
  stages?: string[];
}

export default function TaskAggregationModal({
  isOpen,
  onClose,
  selectedTasks,
  onAggregate,
  projects,
  stages = []
}: TaskAggregationModalProps) {
  const [newDescription, setNewDescription] = useState('');
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [projectId, setProjectId] = useState('');
  const [stage, setStage] = useState('');
  const [priorityScore, setPriorityScore] = useState(5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Initialize form with data from selected tasks
  useEffect(() => {
    if (selectedTasks.length > 0) {
      // Combine descriptions with bullet points
      const combinedDescription = selectedTasks
        .map(task => `• ${task.description}`)
        .join('\n');
      
      setNewDescription(combinedDescription);
      
      // Sum estimated times
      const totalTime = selectedTasks.reduce((sum, task) => sum + task.estimated_time, 0);
      setEstimatedTime(totalTime);
      
      // Get earliest due date
      const dueDates = selectedTasks
        .filter(task => task.due_date)
        .map(task => new Date(task.due_date!).getTime());
      
      if (dueDates.length > 0) {
        const earliestDueDate = new Date(Math.min(...dueDates));
        setDueDate(earliestDueDate.toISOString().split('T')[0]);
      }
      
      // Use project_id of the first task
      const firstTask = selectedTasks[0];
      setProjectId(firstTask.project_id);
      
      // Use stage of the first task if available
      if (firstTask.stage) {
        setStage(firstTask.stage);
      }
      
      // Use highest priority among selected tasks
      const highestPriority = Math.max(...selectedTasks.map(task => task.priority_score || 0));
      setPriorityScore(highestPriority > 0 ? highestPriority : 5);
    }
  }, [selectedTasks]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError('');

    try {
      // Prepare new aggregated task
      const newTask: Partial<Task> = {
        description: newDescription.trim(),
        estimated_time: estimatedTime,
        due_date: dueDate || undefined,
        project_id: projectId,
        priority_score: priorityScore,
        stage: stage || undefined,
        status: 'pending'
      };

      // Get IDs of tasks to remove
      const taskIdsToRemove = selectedTasks.map(task => task.id);

      // Call the handler to create the new task and remove the old ones
      await onAggregate(newTask, taskIdsToRemove);
      onClose();
    } catch (err) {
      console.error('Error aggregating tasks:', err);
      setError('Failed to aggregate tasks. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-medium text-gray-900">Aggregate Tasks</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
            type="button"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4 flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-base font-medium text-gray-900 mb-2">Selected Tasks</h3>
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              {selectedTasks.map(task => (
                <div key={task.id} className="flex items-start">
                  <CheckCircle2 className="w-4 h-4 text-primary mr-2 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-800">{task.description}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      <span className="text-xs text-gray-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {task.estimated_time} hours
                      </span>
                      {task.due_date && (
                        <span className="text-xs text-gray-500 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="newDescription" className="block text-sm font-medium text-gray-700 mb-1">
                New Task Description *
              </label>
              <textarea
                id="newDescription"
                rows={4}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Edit this description to create a single task that encompasses all selected tasks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="estimatedTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Time (hours) *
                </label>
                <input
                  type="number"
                  id="estimatedTime"
                  min="0.1"
                  step="0.1"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  required
                />
              </div>

              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  id="dueDate"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="priorityScore" className="block text-sm font-medium text-gray-700 mb-1">
                  Priority (1-10)
                </label>
                <input
                  type="number"
                  id="priorityScore"
                  min="1"
                  max="10"
                  value={priorityScore}
                  onChange={(e) => setPriorityScore(parseInt(e.target.value) || 5)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>

              {stages.length > 0 && (
                <div>
                  <label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-1">
                    Workflow Stage
                  </label>
                  <select
                    id="stage"
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  >
                    <option value="">No stage</option>
                    {stages.map((stageName) => (
                      <option key={stageName} value={stageName}>
                        {stageName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Project selection (only needed if aggregating tasks from different projects) */}
            {selectedTasks.some(task => task.project_id !== projectId) && (
              <div>
                <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-1">
                  Project *
                </label>
                <select
                  id="projectId"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  required
                >
                  {Object.values(projects).map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </form>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 transition-colors"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isProcessing || !newDescription.trim() || estimatedTime <= 0 || !projectId}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors disabled:opacity-50"
          >
            {isProcessing ? 'Aggregating...' : 'Aggregate Tasks'}
          </button>
        </div>
      </div>
    </div>
  );
}