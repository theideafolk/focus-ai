import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Plus, Trash2, DollarSign, IndianRupee, PoundSterling, Calendar, AlertCircle } from 'lucide-react';
import { userSettingsService } from '../../services/supabaseService';
import type { Project, UserSettings } from '../../types';
import { calculatePriorityScore } from '../../utils/priorityCalculator';

interface ProjectFormProps {
  project?: Partial<Project>;
  onSubmit: (project: Partial<Project>) => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
}

export default function ProjectForm({ project, onSubmit, onClose, isOpen }: ProjectFormProps) {
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    client_name: '',
    description: '',
    start_date: '',
    end_date: '',
    budget: undefined,
    currency: 'USD', // Default currency
    // New fields
    project_type: undefined,
    project_type_other: '',
    user_priority: 3, // Default to middle priority
    complexity: 'medium', // Default to medium complexity
    is_recurring: false,
    ...project,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [userPreferredCurrency, setUserPreferredCurrency] = useState<'USD' | 'INR' | 'GBP'>('USD');
  const [calculatedPriority, setCalculatedPriority] = useState<number | null>(null);

  useEffect(() => {
    if (project) {
      setFormData({
        name: '',
        client_name: '',
        description: '',
        start_date: '',
        end_date: '',
        budget: undefined,
        currency: 'USD', // Default currency
        // New fields
        project_type: undefined,
        project_type_other: '',
        user_priority: 3,
        complexity: 'medium',
        is_recurring: false,
        ...project,
      });
    }
    
    // Fetch user's currency preference
    const fetchSettings = async () => {
      try {
        const settings = await userSettingsService.get();
        if (settings && settings.workflow?.preferredCurrency) {
          setUserPreferredCurrency(settings.workflow.preferredCurrency);
          
          // If creating a new project, use the user's preferred currency as default
          if (!project?.id && !project?.currency) {
            setFormData(prev => ({
              ...prev,
              currency: settings.workflow.preferredCurrency
            }));
          }
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    
    fetchSettings();
  }, [project, isOpen]);

  // Calculate priority score whenever relevant fields change
  useEffect(() => {
    // Only calculate if we have enough information
    if (formData.budget || formData.start_date || formData.user_priority || formData.project_type || formData.complexity) {
      const score = calculatePriorityScore(formData);
      setCalculatedPriority(score);
    } else {
      setCalculatedPriority(null);
    }
  }, [
    formData.budget, 
    formData.start_date, 
    formData.end_date, 
    formData.user_priority, 
    formData.project_type, 
    formData.complexity,
    formData.is_recurring
  ]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Include calculated priority score in the submission
      const dataToSubmit = {
        ...formData,
        priority_score: calculatedPriority || formData.priority_score
      };
      
      await onSubmit(dataToSubmit);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle currency change
  const handleCurrencyChange = (currency: 'USD' | 'INR' | 'GBP') => {
    setFormData({
      ...formData,
      currency
    });
  };
  
  // Format the budget input for display
  const formatBudget = (value: number) => {
    if (formData.currency === 'INR') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(value);
    } else if (formData.currency === 'GBP') {
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP'
      }).format(value);
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-medium text-gray-900">
            {project?.id ? 'Edit Project' : 'New Project'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
                Client Name
              </label>
              <input
                type="text"
                id="client"
                value={formData.client_name || ''}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            {/* Project Type */}
            <div>
              <label htmlFor="project_type" className="block text-sm font-medium text-gray-700 mb-1">
                Project Type
              </label>
              <select
                id="project_type"
                value={formData.project_type || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  project_type: e.target.value ? e.target.value as Project['project_type'] : undefined 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              >
                <option value="">Select a type</option>
                <option value="retainer">Retainer</option>
                <option value="mvp">MVP</option>
                <option value="landing_page">Landing Page</option>
                <option value="website">Website</option>
                <option value="content_creation">Content Creation</option>
                <option value="content_strategy">Content Strategy</option>
                <option value="other">Other</option>
              </select>
              
              {formData.project_type === 'other' && (
                <div className="mt-2">
                  <label htmlFor="project_type_other" className="block text-sm font-medium text-gray-700 mb-1">
                    Specify Project Type
                  </label>
                  <input
                    type="text"
                    id="project_type_other"
                    value={formData.project_type_other || ''}
                    onChange={(e) => setFormData({ ...formData, project_type_other: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    placeholder="Specify project type"
                  />
                </div>
              )}
            </div>

            {/* Timeline Section */}
            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-medium text-gray-900 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                Timeline
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    id="start_date"
                    required
                    value={formData.start_date || ''}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                    End Date {formData.is_recurring && <span className="text-gray-400">(Optional)</span>}
                  </label>
                  <input
                    type="date"
                    id="end_date"
                    value={formData.end_date || ''}
                    disabled={formData.is_recurring}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                      formData.is_recurring ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_recurring"
                  checked={formData.is_recurring}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    is_recurring: e.target.checked,
                    end_date: e.target.checked ? '' : formData.end_date
                  })}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="is_recurring" className="ml-2 block text-sm text-gray-700">
                  No end date / Recurring project
                </label>
              </div>
            </div>

            {/* Complexity and User Priority Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="complexity" className="block text-sm font-medium text-gray-700 mb-1">
                  Complexity Level
                </label>
                <select
                  id="complexity"
                  value={formData.complexity || 'medium'}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    complexity: e.target.value as Project['complexity'] 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="user_priority" className="block text-sm font-medium text-gray-700 mb-1">
                  User Priority (1-5)
                </label>
                <div className="flex items-center">
                  <input
                    type="range"
                    id="user_priority"
                    min="1"
                    max="5"
                    step="1"
                    value={formData.user_priority || 3}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      user_priority: parseInt(e.target.value) 
                    })}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="ml-2 w-6 text-center font-medium text-gray-700">
                    {formData.user_priority || 3}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
            </div>

            {/* Budget Section */}
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-2">
                Budget Currency
              </span>
              <div className="flex space-x-4 mb-4">
                <button
                  type="button"
                  onClick={() => handleCurrencyChange('USD')}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    formData.currency === 'USD'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  USD
                </button>
                <button
                  type="button"
                  onClick={() => handleCurrencyChange('INR')}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    formData.currency === 'INR'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <IndianRupee className="w-4 h-4 mr-2" />
                  INR
                </button>
                <button
                  type="button"
                  onClick={() => handleCurrencyChange('GBP')}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    formData.currency === 'GBP'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <PoundSterling className="w-4 h-4 mr-2" />
                  GBP
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="budget" className="flex items-center text-sm font-medium text-gray-700 mb-1">
                Budget 
                {formData.currency === 'INR' ? (
                  <IndianRupee className="w-4 h-4 ml-1" />
                ) : formData.currency === 'GBP' ? (
                  <PoundSterling className="w-4 h-4 ml-1" />
                ) : (
                  <DollarSign className="w-4 h-4 ml-1" />
                )}
              </label>
              <input
                type="number"
                id="budget"
                min="0"
                step="0.01"
                value={formData.budget || ''}
                onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder={`Enter ${formData.currency} value`}
              />
              {formData.budget && (
                <p className="text-xs text-gray-500 mt-1">
                  Formatted: {formatBudget(Number(formData.budget))}
                </p>
              )}
            </div>

            {/* Priority Score Display */}
            {calculatedPriority !== null && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      Calculated Priority Score: {calculatedPriority}
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      This score is calculated based on budget, timeline, complexity, and other factors.
                      It will help sort your projects by importance.
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                {isSubmitting ? 'Saving...' : project?.id ? 'Save Changes' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}