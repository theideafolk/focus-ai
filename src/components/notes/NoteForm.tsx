import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Check, ChevronDown, Save, ArrowLeft } from 'lucide-react';
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
    title: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const [formInitialized, setFormInitialized] = useState(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);

  // Initialize form data when the modal opens or note changes
  useEffect(() => {
    if (isOpen) {
      if (note) {
        // Editing existing note - load its data
        setFormData({
          content: note.content || '',
          project_id: note.project_id,
          title: note.title || '',
        });
      } else {
        // Creating new note - clear form
        setFormData({
          content: '',
          project_id: undefined,
          title: '',
        });
      }
      
      // Mark form as initialized for focus
      setFormInitialized(true);
      
      // Clear any previous errors or success messages
      setError('');
      setSuccess(false);
    }
  }, [isOpen, note]);

  // Focus on the title field when form is initialized
  useEffect(() => {
    if (isOpen && formInitialized && titleRef.current) {
      // Small delay to ensure the DOM is ready
      const focusTimer = setTimeout(() => {
        if (titleRef.current) {
          titleRef.current.focus();
        }
      }, 50);
      
      return () => clearTimeout(focusTimer);
    }
  }, [isOpen, formInitialized]);

  // Reset form state when closed
  useEffect(() => {
    if (!isOpen) {
      setFormInitialized(false);
      setSuccess(false);
      setIsProjectDropdownOpen(false);
    }
  }, [isOpen]);

  // Close form after showing success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        onClose();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [success, onClose]);

  // Handle ESC key press to close the modal
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  // Add event listener for ESC key
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      // Make sure we have content
      if (!formData.content?.trim()) {
        throw new Error('Note content cannot be empty');
      }
      
      // Create note title from first line if not provided
      const noteToSave = { ...formData };
      if (!noteToSave.title) {
        // Extract first line or first 50 characters as title
        const firstLine = formData.content?.split('\n')[0] || '';
        noteToSave.title = firstLine.substring(0, 50);
      }
      
      await onSubmit(noteToSave);
      
      // Show success message and wait before closing
      setSuccess(true);
      setIsSubmitting(false);
      
      // Form will be closed by useEffect when success is true
    } catch (err) {
      console.error('Note form submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save note');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (formData.content?.trim() && !success && !isSubmitting) {
      if (window.confirm('Are you sure you want to discard this note?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const getSelectedProjectName = () => {
    if (!formData.project_id) return 'No Project';
    const project = projects.find(p => p.id === formData.project_id);
    return project ? project.name : 'No Project';
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fadeIn"
      onClick={handleClose}
    >
      <div 
        className="fixed inset-0 bg-white overflow-hidden flex flex-col animate-slideUp" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={handleClose}
              className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              type="button"
              aria-label="Close"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            <div className="relative">
              <button 
                type="button"
                onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                {getSelectedProjectName()}
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              
              {isProjectDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, project_id: undefined });
                        setIsProjectDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm ${!formData.project_id ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      No Project
                    </button>
                    
                    {projects.map((project) => (
                      <button
                        key={project.id}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, project_id: project.id });
                          setIsProjectDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm ${formData.project_id === project.id ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-100'}`}
                      >
                        {project.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Status indicators */}
          <div className="flex items-center">
            {isSubmitting && (
              <span className="text-sm text-gray-500 mr-4">Saving...</span>
            )}
            
            {success && (
              <span className="text-sm text-green-600 flex items-center mr-4">
                <Check className="w-4 h-4 mr-1" />
                Saved
              </span>
            )}
          </div>
        </div>

        {/* Main content area */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 m-6 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="max-w-4xl mx-auto p-6 pt-10 space-y-6">
            {/* Title field */}
            <input
              type="text"
              ref={titleRef}
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Note Title"
              className="w-full text-3xl font-bold border-none focus:outline-none focus:ring-0 placeholder-gray-300"
            />

            {/* Content field */}
            <textarea
              ref={contentRef}
              value={formData.content || ''}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Start writing your note here..."
              className="w-full min-h-[80vh] text-lg border-none focus:outline-none focus:ring-0 placeholder-gray-300 resize-none"
            />
          </div>
        </form>

        {/* Floating save button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || success || !formData.content?.trim()}
          className="fixed bottom-6 right-6 flex items-center justify-center p-4 rounded-full bg-primary text-white shadow-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:bg-primary/50"
        >
          <Save className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}