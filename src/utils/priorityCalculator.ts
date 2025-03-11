import { Project, PROJECT_TYPE_PRIORITIES, COMPLEXITY_VALUES } from '../types';

/**
 * Calculates priority score based on weighted factors:
 * - Project cost (25%)
 * - Timeline urgency (20%)
 * - User priority (25%)
 * - Project type importance (15%)
 * - Complexity level (15%)
 * 
 * @param project The project to calculate priority for
 * @returns A number between 0-100 representing priority
 */
export function calculatePriorityScore(project: Partial<Project>): number {
  // Weight factors (total should be 1.0)
  const WEIGHTS = {
    COST: 0.25,
    TIMELINE: 0.20,
    USER_PRIORITY: 0.25,
    PROJECT_TYPE: 0.15,
    COMPLEXITY: 0.15
  };
  
  // 1. Calculate cost score (0-100)
  // Higher budgets get higher priority up to a cap
  let costScore = 0;
  if (project.budget) {
    // Base score on budget tiers
    if (project.budget >= 20000) {
      costScore = 100;
    } else if (project.budget >= 10000) {
      costScore = 80;
    } else if (project.budget >= 5000) {
      costScore = 60;
    } else if (project.budget >= 1000) {
      costScore = 40;
    } else {
      costScore = 20;
    }
  }
  
  // 2. Calculate timeline urgency (0-100)
  let timelineScore = 0;
  const today = new Date();
  
  if (project.end_date) {
    const endDate = new Date(project.end_date);
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24)));
    
    if (daysRemaining <= 7) {  // 1 week or less is highest urgency
      timelineScore = 100;
    } else if (daysRemaining <= 14) {  // 2 weeks
      timelineScore = 85;
    } else if (daysRemaining <= 30) {  // 1 month
      timelineScore = 70;
    } else if (daysRemaining <= 60) {  // 2 months
      timelineScore = 50;
    } else if (daysRemaining <= 90) {  // 3 months
      timelineScore = 30;
    } else {
      timelineScore = 15;
    }
    
    // If project is recurring, reduce urgency a bit
    if (project.is_recurring) {
      timelineScore = Math.max(15, timelineScore - 15);
    }
  } else if (project.start_date) {
    // No end date (recurring project), base on start date age
    const startDate = new Date(project.start_date);
    const daysSinceStart = Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 3600 * 24)));
    
    // For recurring projects without end date, give moderate priority based on how long it's been active
    if (daysSinceStart <= 7) {  // Just started
      timelineScore = 65;  // New project gets attention
    } else if (daysSinceStart <= 30) {  // 1 month
      timelineScore = 50;
    } else if (daysSinceStart <= 90) {  // 3 months
      timelineScore = 40;
    } else {
      timelineScore = 30;  // Long-running projects get less urgency
    }
  }
  
  // 3. User priority score (direct mapping from 1-5 scale to 0-100)
  const userPriorityScore = project.user_priority ? (project.user_priority * 20) : 60;  // Default to middle value
  
  // 4. Project type importance (0-100)
  let projectTypeScore = 50;  // Default middle value
  if (project.project_type) {
    projectTypeScore = PROJECT_TYPE_PRIORITIES[project.project_type] || 50;
  }
  
  // 5. Complexity score (0-100)
  let complexityScore = 60;  // Default to medium
  if (project.complexity) {
    complexityScore = COMPLEXITY_VALUES[project.complexity] || 60;
  }
  
  // Calculate weighted score
  const weightedScore = 
    (costScore * WEIGHTS.COST) +
    (timelineScore * WEIGHTS.TIMELINE) +
    (userPriorityScore * WEIGHTS.USER_PRIORITY) +
    (projectTypeScore * WEIGHTS.PROJECT_TYPE) +
    (complexityScore * WEIGHTS.COMPLEXITY);
  
  // Round to nearest integer and ensure within 0-100 range
  return Math.min(100, Math.max(0, Math.round(weightedScore)));
}