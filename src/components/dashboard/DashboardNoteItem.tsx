import React from 'react';
import { Calendar, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Note, Project } from '../../types';

interface DashboardNoteItemProps {
  note: Note;
  project?: Project;
  onClick?: () => void;
}

export default function DashboardNoteItem({ note, project, onClick }: DashboardNoteItemProps) {
  const previewLength = 100;
  const preview = note.content.length > previewLength 
    ? `${note.content.substring(0, previewLength)}...` 
    : note.content;
  
  const formattedDate = new Date(note.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
  
  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 hover:shadow-md transition-shadow h-full cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
        <div className="flex items-center text-xs text-gray-500">
          <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
          <span>{formattedDate}</span>
        </div>
        {project && (
          <Link 
            to={`/projects/${project.id}`} 
            className="text-xs text-primary flex items-center hover:underline truncate max-w-[150px]"
            onClick={e => e.stopPropagation()}
          >
            <LinkIcon className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="truncate">{project.name}</span>
          </Link>
        )}
      </div>
      
      <p className="text-sm text-gray-800 line-clamp-2 whitespace-pre-wrap">{preview}</p>
    </div>
  );
}