import React, { useState } from 'react';
import { Calendar, Clock, Trash2, CheckCircle2, Circle, Edit } from 'lucide-react';
import type { Task, Project } from '../../types';

interface TaskItemProps {
  task: Task;
  project?: Project;
  onStatusChange?: (taskId: string, status: Task['status']) => void;
  onDelete?: (taskId: string) => void;
  hideActions?: boolean;
  onTimeUpdate?: (taskId: string, actualTime: number) => void;
  onEdit?: (task: Task) => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelect?: (taskId: string, selected: boolean) => void;
}

export default function TaskItem({ 
  task, 
  project, 
  onStatusChange, 
  onDelete, 
  hideActions,
  onTimeUpdate,
  onEdit,
  isSelectable = false,
  isSelected = false,
  onSelect
}: TaskItemProps) {
  const [actualTimeInput, setActualTimeInput] = useState(task.actual_time?.toString() || '');
  
  const statusColors = {
    pending: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  
  const priorityColors = {
    high: 'text-red-500',
    medium: 'text-orange-500',
    low: 'text-blue-500',
  };
  
  const getPriorityColor = (score?: number) => {
    if (!score) return '';
    if (score >= 7) return priorityColors.high;
    if (score >= 4) return priorityColors.medium;
    return priorityColors.low;
  };
  
  const handleStatusToggle = () => {
    if (!onStatusChange) return;
    
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    onStatusChange(task.id, newStatus);
  };
  
  const handleTimeUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActualTimeInput(e.target.value);
    
    if (!onTimeUpdate) return;
    
    const actualTime = parseFloat(e.target.value);
    if (!isNaN(actualTime) && actualTime >= 0) {
      onTimeUpdate(task.id, actualTime);
    }
  };
  
  const handleSelectTask = () => {
    if (onSelect) {
      onSelect(task.id, !isSelected);
    }
  };
  
  return (
    <div className={`flex gap-4 ${isSelected ? 'bg-primary/5 rounded-lg' : ''}`}>
      {isSelectable && (
        <div className="pt-1 flex-shrink-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelectTask}
            className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
          />
        </div>
      )}
      
      {onStatusChange && !isSelectable && (
        <button
          onClick={handleStatusToggle}
          className="mt-1 text-gray-400 hover:text-primary transition-colors flex-shrink-0"
          type="button"
          aria-label={task.status === 'completed' ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {task.status === 'completed' ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
        </button>
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1 mb-1">
          <h3 className={`text-sm font-medium ${
            task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'
          } break-words`}>
            {task.description}
          </h3>
        </div>
        
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1">
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[task.status]}`}>
            {task.status.replace('_', ' ')}
          </span>
          
          {project && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full truncate max-w-[150px]">
              {project.name}
            </span>
          )}
          
          {task.stage && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full truncate max-w-[150px]">
              {task.stage}
            </span>
          )}
          
          {task.priority_score !== undefined && (
            <span className={`text-xs ${getPriorityColor(task.priority_score)}`}>
              Priority: {task.priority_score}
            </span>
          )}
        </div>
        
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-xs text-gray-500 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            Est: {task.estimated_time} hours
          </span>
          
          {onTimeUpdate !== undefined && (
            <div className="flex items-center">
              <span className="text-xs text-gray-500 mr-2">Actual:</span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={actualTimeInput}
                onChange={handleTimeUpdate}
                className="w-16 text-xs px-1 py-0.5 border border-gray-300 rounded"
                disabled={!onTimeUpdate}
              />
              <span className="text-xs text-gray-500 ml-1">h</span>
            </div>
          )}
          
          {task.due_date && (
            <span className="text-xs text-gray-500 flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              Due: {new Date(task.due_date).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      
      {!hideActions && !isSelectable && (
        <div className="flex gap-1">
          {onEdit && (
            <button
              onClick={() => onEdit(task)}
              className="text-gray-400 hover:text-primary transition-colors"
              aria-label="Edit task"
              type="button"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          
          {onDelete && (
            <button
              onClick={() => onDelete(task.id)}
              className="text-gray-400 hover:text-red-500 transition-colors"
              aria-label="Delete task"
              type="button"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}