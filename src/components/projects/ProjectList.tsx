import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, DollarSign, Trash2, Edit } from 'lucide-react';
import type { Project } from '../../types';

interface ProjectListProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
  isLoading?: boolean;
}

export default function ProjectList({ projects, onEdit, onDelete, isLoading }: ProjectListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 animate-pulse"
          >
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
        <p className="text-gray-500">Create your first project to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <div
          key={project.id}
          className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100 relative group"
        >
          <Link to={`/projects/${project.id}`} className="block">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
                {project.client_name && (
                  <p className="text-sm text-gray-500 mt-1">{project.client_name}</p>
                )}
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                Priority: {project.priority_score || 0}
              </span>
            </div>
            
            <div className="mt-4 space-y-2">
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
                  <DollarSign className="w-4 h-4 mr-2" />
                  <span>{project.budget.toLocaleString()}</span>
                </div>
              )}
            </div>
          </Link>

          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                onEdit(project);
              }}
              className="p-1 text-gray-500 hover:text-primary transition-colors"
              aria-label="Edit project"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                onDelete(project.id);
              }}
              className="p-1 text-gray-500 hover:text-red-500 transition-colors"
              aria-label="Delete project"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}