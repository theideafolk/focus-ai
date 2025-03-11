import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Tag, BarChart2 } from 'lucide-react';
import type { Project } from '../../types';

interface ProjectCardProps {
  project: Project;
  preferredCurrency?: 'USD' | 'INR' | 'GBP';
}

export default function ProjectCard({ project, preferredCurrency = 'USD' }: ProjectCardProps) {
  const navigate = useNavigate();

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

  // Handle card click - navigate to project details
  const handleCardClick = () => {
    navigate(`/projects/${project.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 border border-gray-100 cursor-pointer h-full"
    >
      <div className="flex justify-between items-start">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-medium text-gray-900 truncate">{project.name}</h3>
          {project.client_name && (
            <p className="text-xs text-gray-500 mt-1 truncate">{project.client_name}</p>
          )}
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary ml-2 flex-shrink-0">
          {project.priority_score || 0}
        </span>
      </div>
      
      <div className="mt-3 space-y-2">
        {/* Project type badge */}
        {project.project_type && (
          <div className="flex items-center text-xs text-gray-500">
            <Tag className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
            <span className="truncate">{formatProjectType(project.project_type)}</span>
            {project.project_type === 'other' && project.project_type_other && (
              <span className="ml-1 truncate">({project.project_type_other})</span>
            )}
          </div>
        )}
        
        {/* Complexity badge */}
        {project.complexity && (
          <div className="flex items-center text-xs flex-wrap gap-1">
            <BarChart2 className="w-3.5 h-3.5 mr-1 text-gray-500 flex-shrink-0" />
            <span className={`px-1.5 py-0.5 rounded-full ${getComplexityColor(project.complexity)}`}>
              {project.complexity.charAt(0).toUpperCase() + project.complexity.slice(1)}
            </span>
            {project.is_recurring && (
              <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Recurring
              </span>
            )}
          </div>
        )}
        
        {/* Due date */}
        {project.end_date && (
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
            <span>Due: {new Date(project.end_date).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}