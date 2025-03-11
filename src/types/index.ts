export interface Project {
  id: string;
  user_id: string;
  name: string;
  client_name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  currency?: 'USD' | 'INR' | 'GBP'; // Project-specific currency
  priority_score?: number;
  documentation?: Array<{ title: string; content: string; }>;
  created_at: string;
  updated_at: string;
  // New fields
  project_type?: 'retainer' | 'mvp' | 'landing_page' | 'website' | 'content_creation' | 'content_strategy' | 'other';
  project_type_other?: string; // For when project_type is 'other'
  user_priority?: number; // 1-5 scale
  complexity?: 'easy' | 'medium' | 'hard';
  is_recurring?: boolean;
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
    preferredCurrency?: 'USD' | 'INR' | 'GBP'; // Default currency preference for user
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

// Type mapping for project type priorities
export const PROJECT_TYPE_PRIORITIES: Record<string, number> = {
  'retainer': 80,         // Steady income, high priority
  'mvp': 90,              // Critical for business validation
  'website': 70,          // Important for online presence
  'landing_page': 60,     // Marketing focus
  'content_creation': 50, // Creative work
  'content_strategy': 65, // Strategic importance
  'other': 50             // Default middle value
};

// Type mapping for complexity level values
export const COMPLEXITY_VALUES: Record<string, number> = {
  'easy': 30,
  'medium': 60,
  'hard': 90
};