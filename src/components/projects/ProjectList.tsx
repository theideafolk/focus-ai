import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, DollarSign, PoundSterling, IndianRupee, Trash2, Edit, Tag, BarChart2 } from 'lucide-react';
import type { Project } from '../../types';

interface ProjectListProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
  isLoading?: boolean;
  preferredCurrency?: 'USD' | 'INR' | 'GBP';
}

export default function ProjectList({ projects, onEdit, onDelete, isLoading, preferredCurrency = 'USD' }: ProjectListProps) {
  const navigate = useNavigate();
  
  const formatBudget = (project: Project) => {
    if (!project.budget) return null;
    
    // Use project's own currency if available, otherwise use preferred currency
    const currency = project.currency || preferredCurrency;
    
    if (currency === 'INR') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(project.budget);
    } else if (currency === 'GBP') {
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP'
      }).format(project.budget);
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(project.budget);
    }
  };

  // Get the currency icon
  const getCurrencyIcon = (project: Project) => {
    const currency = project.currency || preferredCurrency;
    
    if (currency === 'INR') {
      return <IndianRupee className="w-4 h-4 mr-2" />;
    } else if (currency === 'GBP') {
      return <PoundSterling className="w-4 h-4 mr-2" />;
    } else {
      return <DollarSign className="w-4 h-4 mr-2" />;
    }
  };

  // Format project type for display
  const formatProjectType = (type?: string): string => {
    if (!type) return '';
    
    // Convert snake_case to Title Case
    return type.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get complexity badge color
  const getComplexityColor = (complexity?: string): string => {
    switch (complexity) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle project card click
  const handleProjectClick = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

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
          className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100 relative group cursor-pointer"
          onClick={() => handleProjectClick(project.id)}
        >
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
            {/* Project type badge */}
            {project.project_type && (
              <div className="flex items-center text-sm text-gray-500">
                <Tag className="w-4 h-4 mr-2" />
                <span>{formatProjectType(project.project_type)}</span>
                {project.project_type === 'other' && project.project_type_other && (
                  <span className="ml-1">({project.project_type_other})</span>
                )}
              </div>
            )}
            
            {/* Complexity badge */}
            {project.complexity && (
              <div className="flex items-center">
                <BarChart2 className="w-4 h-4 mr-2 text-gray-500" />
                <span className={`text-xs px-2 py-0.5 rounded-full ${getComplexityColor(project.complexity)}`}>
                  {project.complexity.charAt(0).toUpperCase() + project.complexity.slice(1)}
                </span>
                {project.is_recurring && (
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    Recurring
                  </span>
                )}
              </div>
            )}
            
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
                {getCurrencyIcon(project)}
                <span>{formatBudget(project)}</span>
              </div>
            )}
          </div>

          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(project);
              }}
              className="p-1 text-gray-500 hover:text-primary transition-colors bg-white rounded-full shadow-sm"
              aria-label="Edit project"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(project.id);
              }}
              className="p-1 text-gray-500 hover:text-red-500 transition-colors bg-white rounded-full shadow-sm"
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