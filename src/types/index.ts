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
  // Document management
  documents?: ProjectDocument[];
}

export interface Note {
  id: string;
  user_id: string;
  project_id?: string;
  content: string;
  title?: string;
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

// Analytics data types
export interface UserInsights {
  taskCompletionRate: number; // Percentage of tasks completed
  averageActualVsEstimated: number; // Ratio of actual time to estimated time
  mostProductiveDay?: string; // Day of week with most completions
  mostProductiveTimeOfDay?: 'morning' | 'afternoon' | 'evening';
  mostEfficientProjectType?: string; // Project type with best completion rate
  estimationAccuracy: number; // 0-100% for how accurate time estimates are
  projectBalanceScore: number; // 0-100% for work distribution across projects
  totalCompletedTasks: number; // Total number of completed tasks
  totalTrackedTime: number; // Total hours across all tasks
}

export interface TimeEstimateAccuracy {
  taskType: string; // Could be project type, task description category, etc.
  accuracyScore: number; // 0-100% accuracy
  averageEstimatedTime: number; // Average estimated hours
  averageActualTime: number; // Average actual hours
  taskCount: number; // Number of tasks in this category
}

export interface ProjectTypeEfficiency {
  projectType: string;
  taskCount: number;
  completedCount: number;
  completionRate: number; // 0-100%
  averageTimeRatio: number; // Actual time / estimated time ratio
}

export interface ProductivityByDay {
  day: string; // Monday, Tuesday, etc.
  taskCount: number;
  completedCount: number;
  averageTimePerTask: number;
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

// Document category types
export type DocumentCategory = 
  | 'company_overview'
  | 'product_requirements'
  | 'technical_documentation'
  | 'solution_documents'
  | 'supporting_materials'
  | 'custom';

// Interface for project documents
export interface ProjectDocument {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  category: DocumentCategory;
  customCategory?: string; // Used if category is 'custom'
  uploadedAt: string;
  version: number;
  tags: string[];
}

// Helper function to get category display name
export function getCategoryDisplayName(category: DocumentCategory): string {
  switch (category) {
    case 'company_overview':
      return 'Company Overview';
    case 'product_requirements':
      return 'Product Requirements Document (PRD)';
    case 'technical_documentation':
      return 'Technical Documentation';
    case 'solution_documents':
      return 'Solution Documents';
    case 'supporting_materials':
      return 'Supporting Materials';
    case 'custom':
      return 'Custom';
    default:
      return 'Uncategorized';
  }
}

// Document categories for selection
export const DOCUMENT_CATEGORIES: Array<{ value: DocumentCategory; label: string }> = [
  { value: 'company_overview', label: 'Company Overview' },
  { value: 'product_requirements', label: 'Product Requirements Document (PRD)' },
  { value: 'technical_documentation', label: 'Technical Documentation' },
  { value: 'solution_documents', label: 'Solution Documents' },
  { value: 'supporting_materials', label: 'Supporting Materials' },
  { value: 'custom', label: 'Custom Category' }
];