import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Edit, Trash2 } from 'lucide-react';
import type { Note, Project } from '../../types';

interface NoteItemProps {
  note: Note;
  project?: Project;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
}

export default function NoteItem({ note, project, onEdit, onDelete }: NoteItemProps) {
  const previewLength = 150;
  const preview = note.content.length > previewLength 
    ? `${note.content.substring(0, previewLength)}...` 
    : note.content;
  
  const formattedDate = new Date(note.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          {project && (
            <Link
              to={`/projects/${project.id}`}
              className="inline-block text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full"
            >
              {project.name}
            </Link>
          )}
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="w-3 h-3 mr-1" />
            <span>{formattedDate}</span>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(note)}
            className="p-1 text-gray-400 hover:text-primary transition-colors"
            aria-label="Edit note"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            aria-label="Delete note"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="mt-3">
        <p className="text-gray-800 text-sm whitespace-pre-wrap">{preview}</p>
      </div>
    </div>
  );
}