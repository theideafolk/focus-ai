import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, DollarSign, IndianRupee, PoundSterling, Edit, Trash2, ChevronDown, ChevronUp, Plus, FileText, CheckCircle2 } from 'lucide-react';
import { projectService, taskService, noteService, userSettingsService } from '../services/supabaseService';
import { storeNoteEmbedding } from '../services/openaiService';
import type { Project, Task, Note, UserSettings } from '../types';
import PageContainer from '../components/layout/PageContainer';
import TaskList from '../components/tasks/TaskList';
import ProjectForm from '../components/projects/ProjectForm';
import NoteForm from '../components/notes/NoteForm';
import NoteItem from '../components/notes/NoteItem';
import GenerateTasksForm from '../components/tasks/GenerateTasksForm';

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isNoteFormOpen, setIsNoteFormOpen] = useState(false);
  const [isGenerateTasksFormOpen, setIsGenerateTasksFormOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | undefined>();
  const [expandedDocs, setExpandedDocs] = useState<number[]>([]);
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [newDoc, setNewDoc] = useState({ title: '', content: '' });
  const [preferredCurrency, setPreferredCurrency] = useState<'USD' | 'INR' | 'GBP'>('USD');

  useEffect(() => {
    if (id) {
      fetchProjectData(id);
    }
  }, [id]);

  const fetchProjectData = async (projectId: string) => {
    try {
      const [projectData, tasksData, notesData, settings] = await Promise.all([
        projectService.getById(projectId),
        taskService.getByProject(projectId),
        noteService.getByProject(projectId),
        userSettingsService.get(),
      ]);
      setProject(projectData);
      setTasks(tasksData);
      setNotes(notesData);
      
      // Set currency preference
      if (settings?.workflow?.preferredCurrency) {
        setPreferredCurrency(settings.workflow.preferredCurrency);
      }
    } catch (err) {
      setError('Failed to load project details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Format budget with the appropriate currency
  const formatBudget = (budget?: number) => {
    if (!budget) return null;
    
    // Use project's own currency if available, otherwise use preferred currency
    const currency = project?.currency || preferredCurrency;
    
    if (currency === 'INR') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(budget);
    } else if (currency === 'GBP') {
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP'
      }).format(budget);
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(budget);
    }
  };

  // Get the currency icon
  const getCurrencyIcon = () => {
    const currency = project?.currency || preferredCurrency;
    
    if (currency === 'INR') {
      return <IndianRupee className="w-4 h-4 mr-2" />;
    } else if (currency === 'GBP') {
      return <PoundSterling className="w-4 h-4 mr-2" />;
    } else {
      return <DollarSign className="w-4 h-4 mr-2" />;
    }
  };

  const handleUpdateProject = async (updates: Partial<Project>) => {
    if (!project?.id) return;

    try {
      const updatedProject = await projectService.update(project.id, updates);
      setProject(updatedProject);
    } catch (err) {
      throw new Error('Failed to update project');
    }
  };

  const handleDeleteProject = async () => {
    if (!project?.id || !confirm('Are you sure you want to delete this project?')) return;

    try {
      await projectService.delete(project.id);
      navigate('/projects');
    } catch (err) {
      console.error('Failed to delete project:', err);
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
  
  const handleTaskDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await taskService.delete(taskId);
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleAddDocument = async () => {
    if (!project?.id || !newDoc.title || !newDoc.content) return;

    try {
      const updatedProject = await projectService.update(project.id, {
        documentation: [...(project.documentation || []), newDoc]
      });
      setProject(updatedProject);
      setNewDoc({ title: '', content: '' });
      setIsAddingDoc(false);
    } catch (err) {
      console.error('Failed to add document:', err);
    }
  };

  const handleRemoveDocument = async (index: number) => {
    if (!project?.id || !project.documentation) return;

    try {
      const updatedProject = await projectService.update(project.id, {
        documentation: project.documentation.filter((_, i) => i !== index)
      });
      setProject(updatedProject);
    } catch (err) {
      console.error('Failed to remove document:', err);
    }
  };

  const handleCreateNote = async (note: Partial<Note>) => {
    if (!project?.id) return;

    try {
      const newNote = await noteService.create({
        ...note,
        project_id: project.id
      });
      setNotes([newNote, ...notes]);
      
      // Generate and store embedding for the new note
      storeNoteEmbedding(newNote);
      
      return newNote;
    } catch (err) {
      throw new Error('Failed to create note');
    }
  };
  
  const handleUpdateNote = async (note: Partial<Note>) => {
    if (!selectedNote?.id) return;
    
    try {
      const updatedNote = await noteService.update(selectedNote.id, note);
      setNotes(notes.map(n => 
        n.id === updatedNote.id ? updatedNote : n
      ));
      
      // Update embedding for the modified note
      storeNoteEmbedding(updatedNote);
      
      return updatedNote;
    } catch (err) {
      throw new Error('Failed to update note');
    }
  };
  
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      await noteService.delete(noteId);
      setNotes(notes.filter(note => note.id !== noteId));
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };
  
  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setIsNoteFormOpen(true);
  };
  
  const handleNoteFormClose = () => {
    setIsNoteFormOpen(false);
    setSelectedNote(undefined);
  };
  
  const handleNoteFormSubmit = async (note: Partial<Note>) => {
    if (selectedNote) {
      await handleUpdateNote(note);
    } else {
      await handleCreateNote(note);
    }
  };
  
  const handleTasksGenerated = (newTasks: Task[]) => {
    // Refresh the task list to ensure we get the latest data
    if (id) {
      fetchTasks(id);
    }
    setIsGenerateTasksFormOpen(false);
  };
  
  const fetchTasks = async (projectId: string) => {
    try {
      const tasksData = await taskService.getByProject(projectId);
      setTasks(tasksData);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </div>
      </PageContainer>
    );
  }

  if (error || !project) {
    return (
      <PageContainer>
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error || 'Project not found'}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/projects')}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-medium text-gray-900">{project.name}</h1>
            {project.client_name && (
              <p className="text-gray-500 mt-1">{project.client_name}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsFormOpen(true)}
              className="p-2 text-gray-500 hover:text-primary transition-colors"
              aria-label="Edit project"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={handleDeleteProject}
              className="p-2 text-gray-500 hover:text-red-500 transition-colors"
              aria-label="Delete project"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Details</h2>
              {project.description && (
                <p className="text-gray-600 mb-4">{project.description}</p>
              )}
              <div className="space-y-2">
                {(project.start_date || project.end_date) && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>
                      {project.start_date && new Date(project.start_date).toLocaleDateString()}
                      {project.end_date && ` - ${new Date(project.end_date).toLocaleDateString()}`}
                    </span>
                  </div>
                )}
                {project.budget && (
                  <div className="flex items-center text-sm text-gray-500">
                    {getCurrencyIcon()}
                    <span>{formatBudget(project.budget)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Documentation</h2>
                <button
                  onClick={() => setIsAddingDoc(true)}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Document
                </button>
              </div>

              {isAddingDoc && (
                <div className="mb-4 space-y-2 bg-gray-50 p-4 rounded-lg">
                  <input
                    type="text"
                    value={newDoc.title}
                    onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                    placeholder="Document Title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                  <textarea
                    value={newDoc.content}
                    onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
                    placeholder="Document Content"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingDoc(false);
                        setNewDoc({ title: '', content: '' });
                      }}
                      className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddDocument}
                      disabled={!newDoc.title || !newDoc.content}
                      className="px-3 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors disabled:opacity-50"
                    >
                      Add Document
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {project.documentation?.map((doc, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="px-4 py-3 flex items-center justify-between">
                      <button
                        onClick={() => setExpandedDocs(prev => 
                          prev.includes(index)
                            ? prev.filter(i => i !== index)
                            : [...prev, index]
                        )}
                        className="flex-1 text-left font-medium text-gray-900"
                      >
                        {doc.title}
                        {expandedDocs.includes(index) ? (
                          <ChevronUp className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                      <button
                        onClick={() => handleRemoveDocument(index)}
                        className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {expandedDocs.includes(index) && (
                      <div className="px-4 pb-4">
                        <p className="text-gray-600 whitespace-pre-wrap">{doc.content}</p>
                      </div>
                    )}
                  </div>
                ))}
                {(!project.documentation || project.documentation.length === 0) && !isAddingDoc && (
                  <p className="text-center text-gray-500 py-4">
                    No documentation yet. Click "Add Document" to get started.
                  </p>
                )}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Tasks</h2>
                <button
                  onClick={() => setIsGenerateTasksFormOpen(true)}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Generate Tasks
                </button>
              </div>
              <TaskList
                tasks={tasks}
                projects={{ [project.id]: project }}
                onStatusChange={handleTaskStatusChange}
                onDelete={handleTaskDelete}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Notes</h2>
                <button
                  onClick={() => setIsNoteFormOpen(true)}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Add Note
                </button>
              </div>
              
              <div className="space-y-4">
                {notes.map(note => (
                  <NoteItem
                    key={note.id}
                    note={note}
                    onEdit={handleEditNote}
                    onDelete={handleDeleteNote}
                  />
                ))}
                
                {notes.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    No notes for this project yet. Click "Add Note" to get started.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProjectForm
        project={project}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleUpdateProject}
      />
      
      <NoteForm
        note={selectedNote}
        projects={[project]}
        isOpen={isNoteFormOpen}
        onClose={handleNoteFormClose}
        onSubmit={handleNoteFormSubmit}
      />
      
      <GenerateTasksForm
        isOpen={isGenerateTasksFormOpen}
        onClose={() => setIsGenerateTasksFormOpen(false)}
        projects={[project]}
        onTasksGenerated={handleTasksGenerated}
      />
    </PageContainer>
  );
}