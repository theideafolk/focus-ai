import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import type { Task } from '../../types';

interface TaskListProps {
  tasks: Task[];
  onStatusChange?: (taskId: string, status: Task['status']) => void;
}

export default function TaskList({ tasks, onStatusChange }: TaskListProps) {
  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-start gap-4 bg-white p-4 rounded-lg border border-gray-100"
        >
          <button
            onClick={() => onStatusChange?.(
              task.id,
              task.status === 'completed' ? 'pending' : 'completed'
            )}
            className="mt-1 text-gray-400 hover:text-primary transition-colors"
          >
            {task.status === 'completed' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            <p className={`text-sm ${
              task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'
            }`}>
              {task.description}
            </p>
            
            <div className="mt-1 flex items-center gap-4">
              <span className="text-xs text-gray-500">
                {task.estimated_time} hours
              </span>
              {task.due_date && (
                <span className="text-xs text-gray-500">
                  Due: {new Date(task.due_date).toLocaleDateString()}
                </span>
              )}
              <span className="text-xs text-gray-500">
                Priority: {task.priority_score || 0}
              </span>
            </div>
          </div>
        </div>
      ))}
      
      {tasks.length === 0 && (
        <p className="text-center text-gray-500 py-4">No tasks for today</p>
      )}
    </div>
  );
}