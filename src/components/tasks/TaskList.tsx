import React from 'react';
import TaskItem from './TaskItem';
import type { Task, Project } from '../../types';

interface TaskListProps {
  tasks: Task[];
  projects: Record<string, Project>;
  onStatusChange?: (taskId: string, status: Task['status']) => void;
  onDelete?: (taskId: string) => void;
  onTimeUpdate?: (taskId: string, actualTime: number) => void;
  isLoading?: boolean;
}

export default function TaskList({ 
  tasks, 
  projects, 
  onStatusChange, 
  onDelete, 
  onTimeUpdate,
  isLoading 
}: TaskListProps) {
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

  return (
    <div className="divide-y divide-gray-100">
      {tasks.map((task) => (
        <div key={task.id} className="p-4">
          <TaskItem
            task={task}
            project={projects[task.project_id]}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
            onTimeUpdate={onTimeUpdate}
          />
        </div>
      ))}
    </div>
  );
}