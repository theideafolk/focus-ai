import React from 'react';
import NoteItem from './NoteItem';
import type { Note, Project } from '../../types';

interface NoteListProps {
  notes: Note[];
  projects: Record<string, Project>;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
  isLoading?: boolean;
}

export default function NoteList({ notes, projects, onEdit, onDelete, isLoading }: NoteListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/4 mb-4" />
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No notes yet</h3>
        <p className="text-gray-500">Add your first note to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {notes.map((note) => (
        <NoteItem
          key={note.id}
          note={note}
          project={note.project_id ? projects[note.project_id] : undefined}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}