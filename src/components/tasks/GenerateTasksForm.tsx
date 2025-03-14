import React, { useState, useEffect } from 'react';
import { X, LightbulbIcon, PlusCircle, MinusCircle } from 'lucide-react';
import { generateTasks, breakdownTask } from '../../services/openaiService';
import { userSettingsService, taskService } from '../../services/supabaseService';
import type { Project, Task, UserSettings } from '../../types';

interface GenerateTasksFormProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onTasksGenerated: (tasks: Task[]) => void;
}

export default function GenerateTasksForm({ 
  isOpen, 
  onClose, 
  projects, 
  onTasksGenerated 
}: GenerateTasksFormProps) {
  const [projectId, setProjectId] = useState<string>('');
  const [context, setContext] = useState<string>('');
  const [timespanUnit, setTimespanUnit] = useState<'day' | 'week' | 'month'>('week');
  const [timespanValue, setTimespanValue] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [generatedTasks, setGeneratedTasks] = useState<Task[]>([]);
  const [isEditingTasks, setIsEditingTasks] = useState(false);
  const [taskBeingBrokenDown, setTaskBeingBrokenDown] = useState<string | null>(null);
  const [isSavingTasks, setIsSavingTasks] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      fetchUserSettings();
    }
  }, [isOpen]);
  
  const fetchUserSettings = async () => {
    try {
      const settings = await userSettingsService.get();
      setUserSettings(settings);
    } catch (err) {
      console.error('Failed to load user settings:', err);
    }
  };
  
  if (!isOpen) return null;
  
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError('');
    setGeneratedTasks([]);
    
    try {
      // Get the selected project
      const project = projects.find(p => p.id === projectId);
      if (!project && projectId) {
        throw new Error('Selected project not found');
      }
      
      // Create timespan string for the OpenAI prompt
      const timespan = `${timespanValue} ${timespanUnit}${timespanValue > 1 ? 's' : ''}`;
      
      // Generate tasks using the AI service
      const tasks = await generateTasks({
        project,
        context,
        timespan,
        timespanUnit,
        timespanValue,
        userSettings
      });
      
      setGeneratedTasks(tasks);
      setIsEditingTasks(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate tasks');
      console.error('Task generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTaskChange = (index: number, updates: Partial<Task>) => {
    const updatedTasks = [...generatedTasks];
    updatedTasks[index] = { ...updatedTasks[index], ...updates };
    setGeneratedTasks(updatedTasks);
  };

  const handleTaskBreakdown = async (index: number) => {
    const task = generatedTasks[index];
    setTaskBeingBrokenDown(task.id);
    
    try {
      const subtasks = await breakdownTask(task);
      
      // Remove the original task and add the subtasks
      const updatedTasks = [...generatedTasks];
      updatedTasks.splice(index, 1, ...subtasks);
      setGeneratedTasks(updatedTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to break down task');
      console.error('Task breakdown error:', err);
    } finally {
      setTaskBeingBrokenDown(null);
    }
  };

  const handleRemoveTask = (index: number) => {
    const updatedTasks = [...generatedTasks];
    updatedTasks.splice(index, 1);
    setGeneratedTasks(updatedTasks);
  };

  const handleSubmitTasks = async () => {
    if (generatedTasks.length === 0) return;
    
    setIsSavingTasks(true);
    setError('');
    
    try {
      console.log('Saving tasks:', generatedTasks);
      
      // Ensure project_id is set on all tasks
      if (projectId && generatedTasks.some(task => !task.project_id)) {
        console.log('Setting project_id on tasks that need it');
        setGeneratedTasks(generatedTasks.map(task => ({
          ...task,
          project_id: task.project_id || projectId
        })));
      }
      
      // Save all tasks to the database
      const savedTasks: Task[] = [];
      
      for (const task of generatedTasks) {
        // Validate the task has a project_id
        if (!task.project_id) {
          throw new Error('Task must have a project_id');
        }
        
        // Prepare task data for saving (omit the temporary ID)
        const { id, ...taskData } = task;
        
        console.log('Saving task:', taskData);
        
        try {
          // Create the task in the database
          const savedTask = await taskService.create(taskData);
          savedTasks.push(savedTask);
        } catch (err) {
          console.error('Failed to save task:', err, 'Task data:', taskData);
          throw new Error(`Failed to save task: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }
      
      // Pass the saved tasks (with real IDs) back to the parent component
      onTasksGenerated(savedTasks);
      
      // Clear the form
      setGeneratedTasks([]);
      setIsEditingTasks(false);
      setContext('');
      
      // Close the modal
      onClose();
    } catch (err) {
      console.error('Error saving tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to save tasks');
    } finally {
      setIsSavingTasks(false);
    }
  };
  
  // Get the available workflow stages from user settings
  const workflowStages = userSettings?.workflow?.stages?.map((stage: any) => stage.name) || [];
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-medium text-gray-900 flex items-center">
            <LightbulbIcon className="w-5 h-5 mr-2 text-primary" />
            {isEditingTasks ? 'Review & Edit Generated Tasks' : 'Generate Tasks with AI'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {error && (
            <div className="p-6 bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}
          
          {!isEditingTasks ? (
            <form onSubmit={handleGenerate} className="p-6 space-y-4">
              <div className="space-y-1">
                <label htmlFor="project" className="block text-sm font-medium text-gray-700">
                  Project (Optional)
                </label>
                <select
                  id="project"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                >
                  <option value="">Generate for all projects</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  Select a project to focus on, or leave blank to generate balanced tasks across all projects.
                </p>
              </div>
              
              <div className="space-y-1">
                <label htmlFor="context" className="block text-sm font-medium text-gray-700">
                  Additional Context (Optional)
                </label>
                <textarea
                  id="context"
                  rows={3}
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Add any specific goals or context for task generation..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
              
              <div className="space-y-1">
                <label htmlFor="timespan" className="block text-sm font-medium text-gray-700">
                  Time Span
                </label>
                <div className="flex space-x-3">
                  <div className="w-1/3">
                    <input
                      type="number"
                      id="timespanValue"
                      min="1"
                      max="100"
                      value={timespanValue}
                      onChange={(e) => setTimespanValue(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="w-2/3">
                    <select
                      id="timespanUnit"
                      value={timespanUnit}
                      onChange={(e) => setTimespanUnit(e.target.value as 'day' | 'week' | 'month')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    >
                      <option value="day">Day{timespanValue > 1 ? 's' : ''}</option>
                      <option value="week">Week{timespanValue > 1 ? 's' : ''}</option>
                      <option value="month">Month{timespanValue > 1 ? 's' : ''}</option>
                    </select>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Select the time period for which you want to generate tasks.
                </p>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>How it works:</strong> The AI will analyze your project details, documentation, notes, deadlines, 
                  and your personal settings to generate appropriate tasks. Tasks will be balanced across projects to ensure 
                  no single project dominates your schedule and will align with your workflow stages.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 transition-colors"
                  disabled={isGenerating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors disabled:opacity-50"
                >
                  {isGenerating ? 'Generating...' : 'Generate Tasks'}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Review the generated tasks below. You can edit task details, set time estimates, or break down tasks into smaller subtasks.
              </p>
              
              {generatedTasks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No tasks generated. Try adjusting your criteria.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {generatedTasks.map((task, index) => (
                    <div 
                      key={`${task.id}-${index}`} 
                      className="border border-gray-200 rounded-lg p-4 space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <textarea
                          value={task.description}
                          onChange={(e) => handleTaskChange(index, { description: e.target.value })}
                          className="w-full text-sm font-medium text-gray-900 border-none focus:outline-none focus:ring-1 focus:ring-primary/20 rounded-lg"
                          rows={2}
                        />
                        <button
                          onClick={() => handleRemoveTask(index)}
                          className="text-gray-400 hover:text-red-500 transition-colors ml-2 flex-shrink-0"
                        >
                          <MinusCircle className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label htmlFor={`task-${index}-hours`} className="block text-xs text-gray-500 mb-1">
                            Hours Needed
                          </label>
                          <input
                            id={`task-${index}-hours`}
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={isNaN(task.estimated_time) ? '' : task.estimated_time}
                            onChange={(e) => {
                              const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                              handleTaskChange(index, { estimated_time: isNaN(value) ? 1 : value });
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor={`task-${index}-due-date`} className="block text-xs text-gray-500 mb-1">
                            Due Date
                          </label>
                          <input
                            id={`task-${index}-due-date`}
                            type="date"
                            value={task.due_date || ''}
                            onChange={(e) => handleTaskChange(index, { due_date: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor={`task-${index}-priority`} className="block text-xs text-gray-500 mb-1">
                            Priority (1-10)
                          </label>
                          <input
                            id={`task-${index}-priority`}
                            type="number"
                            min="1"
                            max="10"
                            value={isNaN(task.priority_score) ? 5 : task.priority_score}
                            onChange={(e) => {
                              const value = e.target.value === '' ? 5 : parseInt(e.target.value);
                              handleTaskChange(index, { priority_score: isNaN(value) ? 5 : value });
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary"
                          />
                        </div>
                        
                        {workflowStages.length > 0 && (
                          <div>
                            <label htmlFor={`task-${index}-stage`} className="block text-xs text-gray-500 mb-1">
                              Workflow Stage
                            </label>
                            <select
                              id={`task-${index}-stage`}
                              value={task.stage || ''}
                              onChange={(e) => handleTaskChange(index, { stage: e.target.value })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary"
                            >
                              <option value="">No stage</option>
                              {workflowStages.map((stage) => (
                                <option key={stage} value={stage}>
                                  {stage}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                      
                      {/* If selecting a project is optional, we need to make sure project_id is set */}
                      {!projectId && (
                        <div>
                          <label htmlFor={`task-${index}-project`} className="block text-xs text-gray-500 mb-1">
                            Project *
                          </label>
                          <select
                            id={`task-${index}-project`}
                            value={task.project_id || ''}
                            onChange={(e) => handleTaskChange(index, { project_id: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary"
                            required
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
                      
                      <button
                        onClick={() => handleTaskBreakdown(index)}
                        disabled={taskBeingBrokenDown === task.id}
                        className="inline-flex items-center text-xs font-medium text-primary hover:text-primary-dark transition-colors disabled:opacity-50"
                      >
                        {taskBeingBrokenDown === task.id ? (
                          <>
                            <div className="w-3 h-3 mr-1 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                            Breaking down...
                          </>
                        ) : (
                          <>
                            <PlusCircle className="w-3 h-3 mr-1" />
                            Break into smaller tasks
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {isEditingTasks && (
          <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
            <button
              onClick={() => setIsEditingTasks(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 transition-colors"
              disabled={isSavingTasks}
            >
              Back
            </button>
            
            <button
              onClick={handleSubmitTasks}
              disabled={generatedTasks.length === 0 || isSavingTasks || 
                (projectId === '' && generatedTasks.some(task => !task.project_id))}
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors disabled:opacity-50"
            >
              {isSavingTasks ? 'Saving Tasks...' : 'Save Tasks'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}