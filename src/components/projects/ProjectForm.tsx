import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Plus, Trash2, DollarSign, IndianRupee, PoundSterling } from 'lucide-react';
import { userSettingsService } from '../../services/supabaseService';
import type { Project, UserSettings } from '../../types';

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
    ...project,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [userPreferredCurrency, setUserPreferredCurrency] = useState<'USD' | 'INR' | 'GBP'>('USD');

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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit(formData);
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="start_date"
                value={formData.start_date || ''}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="end_date"
                value={formData.end_date || ''}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
          </div>

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
  );
}