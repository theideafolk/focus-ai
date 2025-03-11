import React, { useState } from 'react';
import TaskItem from './TaskItem';
import TaskAggregationModal from './TaskAggregationModal';
import type { Task, Project } from '../../types';
import { MoreHorizontal as CombineHorizontal } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  projects: Record<string, Project>;
  onStatusChange?: (taskId: string, status: Task['status']) => void;
  onDelete?: (taskId: string) => void;
  onTimeUpdate?: (taskId: string, actualTime: number) => void;
  onEdit?: (task: Task) => void;
  onAggregateTasks?: (newTask: Partial<Task>, tasksToRemove: string[]) => Promise<void>;
  isLoading?: boolean;
  hideListStyling?: boolean;
  stages?: string[];
}

export default function TaskList({ 
  tasks, 
  projects, 
  onStatusChange, 
  onDelete, 
  onTimeUpdate,
  onEdit,
  onAggregateTasks,
  isLoading,
  hideListStyling = false,
  stages = []
}: TaskListProps) {
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isAggregationModalOpen, setIsAggregationModalOpen] = useState(false);

  const handleTaskSelection = (taskId: string, selected: boolean) => {
    const newSelection = new Set(selectedTaskIds);
    
    if (selected) {
      newSelection.add(taskId);
    } else {
      newSelection.delete(taskId);
    }
    
    setSelectedTaskIds(newSelection);
  };

  const toggleSelectionMode = () => {
    if (isSelectionMode) {
      // Clear selections when exiting selection mode
      setSelectedTaskIds(new Set());
    }
    setIsSelectionMode(!isSelectionMode);
  };

  const handleAggregateClick = () => {
    if (selectedTaskIds.size >= 2) {
      setIsAggregationModalOpen(true);
    }
  };

  const handleAggregateTasks = async (newTask: Partial<Task>, tasksToRemove: string[]) => {
    if (onAggregateTasks) {
      await onAggregateTasks(newTask, tasksToRemove);
      // Reset selection state after aggregation
      setSelectedTaskIds(new Set());
      setIsSelectionMode(false);
    }
  };

  const selectedTasks = tasks.filter(task => selectedTaskIds.has(task.id));

  if (isLoading) {
    return (
      <div className="divide-y divide-gray-100">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
            <div className="flex gap-2">
              <div className="h-3 bg-gray-200 rounded w-16" />
              <div className="h-3 bg-gray-200 rounded w-20" />
              <div className="h-3 bg-gray-200 rounded w-12" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No tasks found</p>
      </div>
    );
  }

  // Selection mode UI
  const renderSelectionControls = () => {
    if (!onAggregateTasks) return null;
    
    return (
      <div className="bg-white p-3 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center">
          <button
            onClick={toggleSelectionMode}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg mr-3 transition-colors ${
              isSelectionMode 
                ? 'bg-gray-200 text-gray-800' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isSelectionMode ? 'Cancel Selection' : 'Select Tasks'}
          </button>
          
          {isSelectionMode && (
            <span className="text-sm text-gray-500">
              {selectedTaskIds.size} task{selectedTaskIds.size !== 1 ? 's' : ''} selected
            </span>
          )}
        </div>
        
        {isSelectionMode && (
          <button
            onClick={handleAggregateClick}
            disabled={selectedTaskIds.size < 2}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors disabled:opacity-50"
          >
            <CombineHorizontal className="w-4 h-4 mr-1.5" />
            Aggregate Tasks
          </button>
        )}
      </div>
    );
  };

  // If we want to hide the list styling (for embedded task items)
  if (hideListStyling) {
    return (
      <>
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            project={projects[task.project_id]}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
            onTimeUpdate={onTimeUpdate}
            onEdit={onEdit}
          />
        ))}
      </>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {renderSelectionControls()}
      
      <div className="divide-y divide-gray-100">
        {tasks.map((task) => (
          <div key={task.id} className="p-4">
            <TaskItem
              task={task}
              project={projects[task.project_id]}
              onStatusChange={isSelectionMode ? undefined : onStatusChange}
              onDelete={isSelectionMode ? undefined : onDelete}
              onTimeUpdate={isSelectionMode ? undefined : onTimeUpdate}
              onEdit={isSelectionMode ? undefined : onEdit}
              isSelectable={isSelectionMode}
              isSelected={selectedTaskIds.has(task.id)}
              onSelect={handleTaskSelection}
            />
          </div>
        ))}
      </div>
      
      {/* Task Aggregation Modal */}
      <TaskAggregationModal
        isOpen={isAggregationModalOpen}
        onClose={() => setIsAggregationModalOpen(false)}
        selectedTasks={selectedTasks}
        onAggregate={handleAggregateTasks}
        projects={projects}
        stages={stages}
      />
    </div>
  );
}