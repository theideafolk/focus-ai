import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, DollarSign, IndianRupee, PoundSterling, Edit, Trash2, ChevronDown, ChevronUp, Plus, FileText, CheckCircle2, FileUp } from 'lucide-react';
import { projectService, taskService, noteService, userSettingsService } from '../services/supabaseService';
import { documentService } from '../services/documentService';
import { storeNoteEmbedding } from '../services/openaiService';
import type { Project, Task, Note, UserSettings, ProjectDocument } from '../types';
import PageContainer from '../components/layout/PageContainer';
import TaskList from '../components/tasks/TaskList';
import TaskForm from '../components/tasks/TaskForm';
import ProjectForm from '../components/projects/ProjectForm';
import NoteForm from '../components/notes/NoteForm';
import GenerateTasksForm from '../components/tasks/GenerateTasksForm';
import DocumentUploader from '../components/documents/DocumentUploader';
import DocumentList from '../components/documents/DocumentList';

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
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isGenerateTasksFormOpen, setIsGenerateTasksFormOpen] = useState(false);
  const [isDocumentUploaderOpen, setIsDocumentUploaderOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | undefined>();
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [expandedDocs, setExpandedDocs] = useState<number[]>([]);
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [newDoc, setNewDoc] = useState({ title: '', content: '' });
  const [preferredCurrency, setPreferredCurrency] = useState<'USD' | 'INR' | 'GBP'>('USD');
  const [activeTab, setActiveTab] = useState<'documents' | 'documentation' | 'notes' | 'tasks'>('tasks');
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [stages, setStages] = useState<string[]>([]);

  useEffect(() => {
    if (id) {
      fetchProjectData(id);
    }
  }, [id]);

  useEffect(() => {
    // Extract workflow stages from user settings
    if (userSettings?.workflow?.stages) {
      const stageNames = userSettings.workflow.stages.map((stage: any) => stage.name);
      setStages(stageNames);
    }
  }, [userSettings]);

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
      setUserSettings(settings);
      
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
  
  const handleTaskEdit = (task: Task) => {
    setSelectedTask(task);
    setIsTaskFormOpen(true);
  };
  
  const handleCreateTask = () => {
    setSelectedTask(undefined);
    setIsTaskFormOpen(true);
  };
  
  const handleTaskFormSubmit = async (taskData: Partial<Task>) => {
    if (!project?.id) return;
    
    try {
      if (selectedTask?.id) {
        // Update existing task
        const updatedTask = await taskService.update(selectedTask.id, taskData);
        setTasks(tasks.map(task => 
          task.id === updatedTask.id ? updatedTask : task
        ));
      } else {
        // Create new task
        const newTask = await taskService.create({
          ...taskData,
          project_id: project.id
        });
        setTasks([newTask, ...tasks]);
      }
    } catch (err) {
      throw new Error('Failed to save task');
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

  // Handler for opening a clean note form
  const handleOpenNewNoteForm = () => {
    // Reset selected note to ensure form starts fresh
    setSelectedNote(undefined);
    setIsNoteFormOpen(true);
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

  // Document upload handlers
  const handleDocumentUploadComplete = async (document: ProjectDocument) => {
    if (!project?.id) return;
    
    try {
      await documentService.addDocumentToProject(project.id, document);
      // Refresh project data to get updated documents
      const updatedProject = await projectService.getById(project.id);
      setProject(updatedProject);
      setIsDocumentUploaderOpen(false);
    } catch (err) {
      console.error('Failed to add document to project:', err);
    }
  };
  
  const handleDeleteDocument = async (documentId: string) => {
    if (!project?.id || !confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await documentService.removeDocumentFromProject(project.id, documentId);
      // Refresh project data to get updated documents
      const updatedProject = await projectService.getById(project.id);
      setProject(updatedProject);
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const handleAggregateTasks = async (newTask: Partial<Task>, taskIdsToRemove: string[]) => {
    try {
      // Create the new aggregated task
      const createdTask = await taskService.create({
        ...newTask,
        project_id: project?.id || ''
      });
      
      // Delete the tasks that were aggregated
      for (const taskId of taskIdsToRemove) {
        await taskService.delete(taskId);
      }
      
      // Update the tasks state by removing the old tasks and adding the new one
      setTasks(prevTasks => [
        createdTask,
        ...prevTasks.filter(task => !taskIdsToRemove.includes(task.id))
      ]);

      return createdTask;
    } catch (error) {
      console.error('Error during task aggregation:', error);
      throw new Error('Failed to aggregate tasks');
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

            <div>
              {/* Project Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-blue-500 text-sm font-medium">Tasks</div>
                  <div className="mt-1 text-2xl font-semibold">{tasks.length}</div>
                  <div className="mt-1 text-xs text-blue-600">
                    {tasks.filter(t => t.status === 'completed').length} completed
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-green-500 text-sm font-medium">Notes</div>
                  <div className="mt-1 text-2xl font-semibold">{notes.length}</div>
                  <div className="mt-1 text-xs text-green-600">
                    {project.documentation?.length || 0} documentation entries
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-purple-500 text-sm font-medium">Documents</div>
                  <div className="mt-1 text-2xl font-semibold">{project.documents?.length || 0}</div>
                  <div className="mt-1 text-xs text-purple-600">
                    {project.documents?.reduce((count, doc) => count + doc.tags.length, 0) || 0} tags
                  </div>
                </div>
                <div className="bg-amber-50 rounded-lg p-4">
                  <div className="text-amber-500 text-sm font-medium">Priority</div>
                  <div className="mt-1 text-2xl font-semibold">{project.priority_score || 0}</div>
                  <div className="mt-1 text-xs text-amber-600">
                    {project.user_priority ? `User priority: ${project.user_priority}/5` : 'Not set'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mt-8">
            <nav className="-mb-px flex space-x-6">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tasks'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 inline-block mr-2" />
                Tasks
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'documents'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="w-4 h-4 inline-block mr-2" />
                Documents
              </button>
              <button
                onClick={() => setActiveTab('documentation')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'documentation'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="w-4 h-4 inline-block mr-2" />
                Text Documentation
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'notes'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="w-4 h-4 inline-block mr-2" />
                Notes
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Tasks</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateTask}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Task
                    </button>
                    <button
                      onClick={() => setIsGenerateTasksFormOpen(true)}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Generate Tasks
                    </button>
                  </div>
                </div>
                <TaskList
                  tasks={tasks}
                  projects={{ [project.id]: project }}
                  onStatusChange={handleTaskStatusChange}
                  onDelete={handleTaskDelete}
                  onEdit={handleTaskEdit}
                  onAggregateTasks={handleAggregateTasks}
                  stages={stages}
                />
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Documents</h2>
                  <button
                    onClick={() => setIsDocumentUploaderOpen(true)}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                  >
                    <FileUp className="w-4 h-4 mr-2" />
                    Upload Document
                  </button>
                </div>
                
                <DocumentList 
                  documents={project.documents || []}
                  onDelete={handleDeleteDocument}
                />
              </div>
            )}

            {/* Text Documentation Tab */}
            {activeTab === 'documentation' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Text Documentation</h2>
                  <button
                    onClick={() => setIsAddingDoc(true)}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Entry
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
                          className="flex-1 text-left font-medium text-gray-900 flex items-center"
                        >
                          {doc.title}
                          {expandedDocs.includes(index) ? (
                            <ChevronUp className="w-4 h-4 text-gray-500 ml-2" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-500 ml-2" />
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
                      No documentation yet. Click "Add Entry" to get started.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Notes</h2>
                  <button
                    onClick={handleOpenNewNoteForm}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Add Note
                  </button>
                </div>
                
                <div className="space-y-4">
                  {notes.map(note => (
                    <div key={note.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-xs text-gray-500">
                            {new Date(note.created_at).toLocaleDateString()}
                          </span>
                          <p className="text-gray-800 whitespace-pre-wrap">{note.content}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditNote(note)}
                            className="p-1 text-gray-400 hover:text-primary transition-colors"
                            aria-label="Edit note"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            aria-label="Delete note"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {notes.length === 0 && (
                    <p className="text-center text-gray-500 py-4">
                      No notes for this project yet. Click "Add Note" to get started.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
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
      
      <TaskForm
        task={selectedTask}
        projectId={project.id}
        isOpen={isTaskFormOpen}
        onClose={() => {
          setIsTaskFormOpen(false);
          setSelectedTask(undefined);
        }}
        onSubmit={handleTaskFormSubmit}
      />
      
      <GenerateTasksForm
        isOpen={isGenerateTasksFormOpen}
        onClose={() => setIsGenerateTasksFormOpen(false)}
        projects={[project]}
        onTasksGenerated={handleTasksGenerated}
      />

      {isDocumentUploaderOpen && (
        <DocumentUploader
          projectId={project.id}
          onUploadComplete={handleDocumentUploadComplete}
          onCancel={() => setIsDocumentUploaderOpen(false)}
        />
      )}
    </PageContainer>
  );
}