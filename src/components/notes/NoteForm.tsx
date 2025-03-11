import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { Note, Project } from '../../types';

interface NoteFormProps {
  note?: Partial<Note>;
  projects: Project[];
  onSubmit: (note: Partial<Note>) => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
}

export default function NoteForm({ note, projects, onSubmit, onClose, isOpen }: NoteFormProps) {
  const [formData, setFormData] = useState<Partial<Note>>({
    content: '',
    project_id: undefined,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [formInitialized, setFormInitialized] = useState(false);

  // Initialize form data when the modal opens or note changes
  useEffect(() => {
    if (isOpen) {
      if (note) {
        // Editing existing note - load its data
        setFormData({
          content: note.content || '',
          project_id: note.project_id,
        });
      } else {
        // Creating new note - clear form
        setFormData({
          content: '',
          project_id: undefined,
        });
      }
      
      // Mark form as initialized for focus
      setFormInitialized(true);
      
      // Clear any previous errors
      setError('');
    }
  }, [isOpen, note]);

  // Focus on the content field when form is initialized
  useEffect(() => {
    if (isOpen && formInitialized && contentRef.current) {
      // Small delay to ensure the DOM is ready
      const focusTimer = setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.focus();
        }
      }, 50);
      
      return () => clearTimeout(focusTimer);
    }
  }, [isOpen, formInitialized]);

  // Reset form state when closed
  useEffect(() => {
    if (!isOpen) {
      setFormInitialized(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      console.log('Submitting note form:', formData);
      await onSubmit(formData);
      // Form will be closed by the parent component
    } catch (err) {
      console.error('Note form submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save note');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    console.log('Closing note form');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-medium text-gray-900">
            {note ? 'Edit Note' : 'New Note'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
            type="button"
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
            <label htmlFor="project_id" className="block text-sm font-medium text-gray-700 mb-1">
              Project (Optional)
            </label>
            <select
              id="project_id"
              value={formData.project_id || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                project_id: e.target.value ? e.target.value : undefined 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            >
              <option value="">No Project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              Note Content *
            </label>
            <textarea
              id="content"
              required
              rows={10}
              ref={contentRef}
              value={formData.content || ''}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              placeholder="Write your note here..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
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
              {isSubmitting ? 'Saving...' : note ? 'Save Changes' : 'Save Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}