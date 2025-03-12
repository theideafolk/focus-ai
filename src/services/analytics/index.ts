import userInsightsService from './userInsightsService';
import timeEstimateService from './timeEstimateService';
import projectTypeService from './projectTypeService';
import productivityService from './productivityService';
import contextService from './contextService';

// Export services
export {
  userInsightsService,
  timeEstimateService,
  projectTypeService,
  productivityService,
  contextService
};

// Combined analytics service for backward compatibility
export const analyticsService = {
  // User insights
  getUserInsights: userInsightsService.getUserInsights,
  hasEnoughDataForInsights: userInsightsService.hasEnoughDataForInsights,
  
  // Time estimate functions
  getTimeEstimateAccuracy: timeEstimateService.getTimeEstimateAccuracy,
  getEstimationStyle: timeEstimateService.getEstimationStyle,
  
  // Project type functions
  getProjectTypeEfficiency: projectTypeService.getProjectTypeEfficiency,
  getProjectTypeDistribution: projectTypeService.getProjectTypeDistribution,
  getProjectPriorityRange: projectTypeService.getProjectPriorityRange,
  
  // Productivity functions
  getProductivityByDay: productivityService.getProductivityByDay,
  formatWorkDays: productivityService.formatWorkDays,
  getUpcomingDeadlines: productivityService.getUpcomingDeadlines,
  
  // Context functions
  getAIUserContext: contextService.getAIUserContext,
  getAverageNoteLength: contextService.getAverageNoteLength,
  getNoteDetailLevel: contextService.getNoteDetailLevel,
  getSkillLevelDescription: contextService.getSkillLevelDescription
};

export default analyticsService;