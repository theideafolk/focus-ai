export interface Project {
  id: string;
  user_id: string;
  name: string;
  client_name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  priority_score?: number;
  documentation?: Array<{ title: string; content: string; }>;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  project_id?: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  description: string;
  estimated_time: number;
  due_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority_score?: number;
  created_at: string;
  updated_at: string;
  stage?: string; // Optional workflow stage
  actual_time?: number; // Track actual time spent for AI learning
  started_at?: string; // When the task was started
  completed_at?: string; // When the task was completed
}

export interface UserSettings {
  id: string;
  user_id: string;
  skills: any[];
  time_estimates: Record<string, unknown>;
  workflow: {
    displayName?: string;
    maxDailyHours?: number;
    workDays?: number[];
    goals?: any[];
    stages?: any[];
  };
  created_at: string;
  updated_at: string;
}

export interface AIContext {
  id: string;
  user_id: string;
  context_summary?: string;
  last_updated: string;
}