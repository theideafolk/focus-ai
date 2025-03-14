import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
// Import from updated service structure
import { 
  projectService, 
  taskService, 
  noteService, 
  userSettingsService,
  storeNoteEmbedding
} from '../services';
import type { Project, Task, Note, UserSettings } from '../types';
import PageContainer from '../components/layout/PageContainer';
import ProjectCard from '../components/dashboard/ProjectCard';
import DashboardNoteItem from '../components/dashboard/DashboardNoteItem';
import StreakCounter from '../components/dashboard/StreakCounter';
import NoteForm from '../components/notes/NoteForm';
import TaskItem from '../components/tasks/TaskItem';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, FileText, LightbulbIcon, Edit, Calendar } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, streakCount } = useAuth(); // Get streakCount from auth context
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [projectsMap, setProjectsMap] = useState<Record<string, Project>>({});
  const [isNoteFormOpen, setIsNoteFormOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | undefined>(undefined);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [preferredCurrency, setPreferredCurrency] = useState<'USD' | 'INR' | 'GBP'>('USD');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [projectsData, tasksData, notesData, settings] = await Promise.all([
        projectService.getAll(),
        taskService.getByStatus('pending'),
        noteService.getAll(),
        userSettingsService.get(),
      ]);

      // Sort projects by priority
      const sortedProjects = [...projectsData].sort((a, b) => 
        (b.priority_score || 0) - (a.priority_score || 0)
      );
      
      setProjects(sortedProjects.slice(0, 3)); // Show top 3 projects by priority
      
      // Create a map of projects for quick lookup
      const projectMap: Record<string, Project> = {};
      projectsData.forEach(project => {
        projectMap[project.id] = project;
      });
      setProjectsMap(projectMap);
      
      // Get today's tasks or upcoming tasks and sort by due date
      const today = new Date().toISOString().split('T')[0];
      const upcomingTasks = tasksData
        .filter(task => !task.due_date || task.due_date >= today)
        .sort((a, b) => {
          // Sort by due date (ascending)
          if (a.due_date && b.due_date) {
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          }
          // Tasks without due dates come last
          if (a.due_date) return -1;
          if (b.due_date) return 1;
          
          // If neither has a due date, sort by priority
          return (b.priority_score || 0) - (a.priority_score || 0);
        })
        .slice(0, 5); // Just show top 5 upcoming tasks
        
      setTasks(upcomingTasks);
      
      // Get recent notes
      const recentNotes = [...notesData]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3); // Show 3 most recent notes
      setNotes(recentNotes);
      
      // Set user settings and preferred currency
      if (settings) {
        setUserSettings(settings);
        if (settings.workflow?.preferredCurrency) {
          setPreferredCurrency(settings.workflow.preferredCurrency);
        }
      }
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskStatusChange = async (taskId: string, status: Task['status']) => {
    try {
      console.log('Changing task status:', taskId, status);
      await taskService.updateStatus(taskId, status);
      
      // Update the local state immediately
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status } : task
      ));
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };
  
  const handleCreateNote = async (note: Partial<Note>) => {
    try {
      const newNote = await noteService.create(note);
      
      // Generate and store embedding for the new note
      storeNoteEmbedding(newNote);
      
      // Update notes list
      setNotes([newNote, ...notes.slice(0, 2)]); // Keep only 3 notes in the dashboard view
      setIsNoteFormOpen(false);
      
      return newNote;
    } catch (err) {
      console.error('Failed to create note:', err);
      throw new Error('Failed to create note');
    }
  };
  
  const handleUpdateNote = async (note: Partial<Note>) => {
    if (!selectedNote?.id) return;
    
    try {
      const updatedNote = await noteService.update(selectedNote.id, note);
      
      // Update embedding for the modified note
      storeNoteEmbedding(updatedNote);
      
      // Update notes list
      setNotes(notes.map(n => 
        n.id === updatedNote.id ? updatedNote : n
      ));
      
      return updatedNote;
    } catch (err) {
      console.error('Failed to update note:', err);
      throw new Error('Failed to update note');
    } finally {
      // Always close the form and clear selected note
      setIsNoteFormOpen(false);
      setSelectedNote(undefined);
    }
  };
  
  const handleNoteClick = (note: Note) => {
    console.log('Note clicked:', note.id);
    // First set the selected note
    setSelectedNote(note);
    // Then open the form modal
    setIsNoteFormOpen(true);
  };
  
  const handleTaskDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      console.log('Deleting task:', taskId);
      await taskService.delete(taskId);
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };
  
  // Add focus listener to refresh data when tab gets focus (like when returning from project edit)
  useEffect(() => {
    const handleFocus = () => {
      fetchDashboardData();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Create new note with a clean interface
  const handleCreateNewNote = () => {
    console.log('Creating new note');
    // Reset the selected note to ensure form starts fresh
    setSelectedNote(undefined);
    // Open the form modal with a small delay to ensure state is updated
    setTimeout(() => setIsNoteFormOpen(true), 0);
  };

  // Close note form and reset
  const handleCloseNoteForm = () => {
    setIsNoteFormOpen(false);
    setSelectedNote(undefined);
  };

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Welcome Section with streak counter */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-medium text-gray-900">
              Welcome back, {user?.email?.split('@')[0]}
            </h1>
            <p className="mt-1 text-gray-500">
              Here's your focus for today
            </p>
          </div>
          
          {/* Streak counter positioned in top-right */}
          <div className="animate-fadeIn">
            <StreakCounter streak={streakCount} />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          </div>
        ) : (
          <>
            {/* Top Projects Section */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  Top Priority Projects
                </h2>
                <div className="flex gap-2">
                  <Link
                    to="/projects"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors"
                    aria-label="Add project"
                    title="Add project"
                  >
                    <Plus className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map(project => (
                  <ProjectCard 
                    key={project.id} 
                    project={project}
                    preferredCurrency={preferredCurrency}
                  />
                ))}
                {projects.length === 0 && (
                  <p className="text-gray-500 col-span-full py-4 text-center">
                    No projects yet. Create your first project to get started.
                  </p>
                )}
              </div>
              <Link
                to="/projects"
                className="mt-3 block text-sm text-center text-primary hover:text-primary-dark"
              >
                View all projects
              </Link>
            </section>

            {/* Notes Section */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  Recent Notes
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateNewNote}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors"
                    aria-label="Add note"
                    title="Add note"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {notes.map(note => (
                  <DashboardNoteItem 
                    key={note.id} 
                    note={note}
                    project={note.project_id ? projectsMap[note.project_id] : undefined}
                    onClick={() => handleNoteClick(note)}
                  />
                ))}
                {notes.length === 0 && (
                  <div className="col-span-full bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
                    <FileText className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">No notes yet. Add your first note to get started.</p>
                    <button
                      onClick={handleCreateNewNote}
                      className="mt-3 inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Add First Note
                    </button>
                  </div>
                )}
              </div>
              <Link
                to="/notes"
                className="mt-3 block text-sm text-center text-primary hover:text-primary-dark"
              >
                View all notes
              </Link>
            </section>

            {/* Tasks Section */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  Today's Tasks
                </h2>
                <div className="flex gap-2">
                  <Link
                    to="/tasks"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors"
                    aria-label="Add task"
                    title="Add task"
                  >
                    <Plus className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {tasks.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-gray-500">No tasks for today</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {tasks.map((task) => (
                      <div key={task.id} className="p-4">
                        <TaskItem
                          task={task}
                          project={projectsMap[task.project_id]}
                          onStatusChange={handleTaskStatusChange}
                          onDelete={handleTaskDelete}
                          hideActions={false}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <Link
                to="/tasks"
                className="mt-3 block text-sm text-center text-primary hover:text-primary-dark"
              >
                View all tasks
              </Link>
            </section>
          </>
        )}
      </div>
      
      {/* Note Form Modal */}
      <NoteForm
        note={selectedNote}
        isOpen={isNoteFormOpen}
        onClose={handleCloseNoteForm}
        onSubmit={selectedNote ? handleUpdateNote : handleCreateNote}
        projects={projects}
      />
    </PageContainer>
  );
}