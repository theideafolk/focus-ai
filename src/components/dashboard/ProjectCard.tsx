import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, DollarSign, IndianRupee, PoundSterling } from 'lucide-react';
import type { Project } from '../../types';

interface ProjectCardProps {
  project: Project;
  preferredCurrency?: 'USD' | 'INR' | 'GBP';
}

export default function ProjectCard({ project, preferredCurrency = 'USD' }: ProjectCardProps) {
  // Function to format budget with the appropriate currency
  const formatBudget = (budget?: number) => {
    if (!budget) return null;
    
    // Use project's own currency if available, otherwise use preferred currency
    const currency = project.currency || preferredCurrency;
    
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
    const currency = project.currency || preferredCurrency;
    
    if (currency === 'INR') {
      return <IndianRupee className="w-4 h-4 mr-2" />;
    } else if (currency === 'GBP') {
      return <PoundSterling className="w-4 h-4 mr-2" />;
    } else {
      return <DollarSign className="w-4 h-4 mr-2" />;
    }
  };

  return (
    <Link
      to={`/projects/${project.id}`}
      className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100"
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
    </Link>
  );
}