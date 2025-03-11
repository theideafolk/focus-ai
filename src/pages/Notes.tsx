import React, { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { noteService, projectService } from '../services/supabaseService';
import { searchSimilarNotes, storeNoteEmbedding } from '../services/openaiService';
import type { Note, Project } from '../types';
import PageContainer from '../components/layout/PageContainer';
import NoteList from '../components/notes/NoteList';
import NoteForm from '../components/notes/NoteForm';

type FilterType = 'all' | 'project' | string;

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsMap, setProjectsMap] = useState<Record<string, Project>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Fetch notes and projects on component mount
  useEffect(() => {
    fetchData();
  }, []);
  
  // Apply filters and search whenever notes, filter, or search query changes
  useEffect(() => {
    applyFiltersAndSearch();
  }, [notes, filter, searchQuery]);
  
  // Create a map of projects for quick access
  useEffect(() => {
    const map: Record<string, Project> = {};
    projects.forEach(project => {
      map[project.id] = project;
    });
    setProjectsMap(map);
  }, [projects]);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const [notesData, projectsData] = await Promise.all([
        noteService.getAll(),
        projectService.getAll()
      ]);
      setNotes(notesData);
      setProjects(projectsData);
    } catch (err) {
      setError('Failed to load notes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const applyFiltersAndSearch = async () => {
    let filtered = [...notes];
    
    // Apply project filter
    if (filter === 'all') {
      // No filtering needed
    } else if (filter === 'project') {
      filtered = filtered.filter(note => note.project_id);
    } else {
      filtered = filtered.filter(note => note.project_id === filter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      setIsSearching(true);
      try {
        // Always apply text matching as a fallback
        filtered = filtered.filter(note => 
          note.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        // Try vector search if we have embeddings
        try {
          const similarNoteIds = await searchSimilarNotes(searchQuery);
          if (similarNoteIds.length > 0) {
            // Add any semantic matches that weren't already included
            const existingIds = new Set(filtered.map(note => note.id));
            const semanticMatches = notes.filter(note => 
              !existingIds.has(note.id) && similarNoteIds.includes(note.id)
            );
            filtered = [...filtered, ...semanticMatches];
          }
        } catch (err) {
          // If semantic search fails, we still have text search results
          console.warn('Semantic search failed:', err);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }
    
    setFilteredNotes(filtered);
  };
  
  const handleCreateNote = async (note: Partial<Note>) => {
    try {
      const newNote = await noteService.create(note);
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
  
  const handleEdit = (note: Note) => {
    setSelectedNote(note);
    setIsFormOpen(true);
  };
  
  // Handler for opening the note form with a clean interface
  const handleOpenNewNoteForm = () => {
    // Clear any previously selected note
    setSelectedNote(undefined);
    // Open the form modal
    setIsFormOpen(true);
  };
  
  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedNote(undefined);
  };
  
  const handleFormSubmit = async (note: Partial<Note>) => {
    if (selectedNote) {
      await handleUpdateNote(note);
    } else {
      await handleCreateNote(note);
    }
  };
  
  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-medium text-gray-900">Notes</h1>
            <p className="mt-1 text-gray-500">
              Capture ideas and context for your projects
            </p>
          </div>
          <button
            onClick={handleOpenNewNoteForm}
            className="inline-flex items-center justify-center h-10 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
            aria-label="New Note"
          >
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">New Note</span>
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
          
          {/* Filter dropdown */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          >
            <option value="all">All Notes</option>
            <option value="project">Project Notes</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        
        {isSearching && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
            <p className="text-sm text-gray-500 mt-2">Searching notes...</p>
          </div>
        )}
        
        <NoteList
          notes={filteredNotes}
          projects={projectsMap}
          onEdit={handleEdit}
          onDelete={handleDeleteNote}
          isLoading={loading}
        />
        
        <NoteForm
          note={selectedNote}
          projects={projects}
          isOpen={isFormOpen}
          onClose={handleFormClose}
          onSubmit={handleFormSubmit}
        />
      </div>
    </PageContainer>
  );
}