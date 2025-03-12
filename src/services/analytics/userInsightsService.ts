import type { Task, Project, UserSettings, UserInsights } from '../../types';

/**
 * Service for analyzing user productivity and generating insights
 */
export const userInsightsService = {
  /**
   * Get comprehensive user insights based on tasks, projects, and settings
   */
  getUserInsights(tasks: Task[], projects: Record<string, Project>, userSettings: UserSettings | null): UserInsights | null {
    // Need minimum data to provide insights
    if (tasks.length < 5) {
      return null;
    }
    
    // Calculate completion rate
    const completedTasks = tasks.filter(task => task.status === 'completed');
    const taskCompletionRate = completedTasks.length / tasks.length;
    
    // Only use tasks with both estimated and actual time for time accuracy
    const tasksWithTimeData = completedTasks.filter(task => 
      task.estimated_time && task.actual_time && task.actual_time > 0
    );
    
    // Time estimation accuracy metrics
    let averageActualVsEstimated = 0;
    let estimationAccuracy = 0;
    
    if (tasksWithTimeData.length > 0) {
      // Calculate actual vs estimated time ratio
      const timeRatios = tasksWithTimeData.map(task => 
        task.actual_time! / task.estimated_time
      );
      
      averageActualVsEstimated = timeRatios.reduce((a, b) => a + b, 0) / timeRatios.length;
      
      // Calculate accuracy percentage (how close to 1.0 ratio on average)
      // Accuracy decreases the further from 1.0 (perfect estimate) in either direction
      estimationAccuracy = timeRatios.map(ratio => {
        const distance = Math.abs(ratio - 1);
        // Transform distance to 0-100% scale - closer to 1.0 is higher accuracy
        return Math.max(0, 100 - (distance * 50)); // 100% at ratio=1, 0% at ratio=3 or ratio=0
      }).reduce((a, b) => a + b, 0) / timeRatios.length;
    }
    
    // Calculate most productive day if we have completion timestamps
    let mostProductiveDay: string | undefined = undefined;
    
    const tasksWithCompletionTime = completedTasks.filter(task => task.completed_at);
    if (tasksWithCompletionTime.length > 0) {
      // Count completions by day of week
      const completionsByDay: Record<string, number> = {
        'Sunday': 0, 'Monday': 0, 'Tuesday': 0, 'Wednesday': 0,
        'Thursday': 0, 'Friday': 0, 'Saturday': 0
      };
      
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      tasksWithCompletionTime.forEach(task => {
        if (task.completed_at) {
          const date = new Date(task.completed_at);
          const day = dayNames[date.getDay()];
          completionsByDay[day]++;
        }
      });
      
      // Find day with most completions
      mostProductiveDay = Object.entries(completionsByDay)
        .sort(([, a], [, b]) => b - a)[0][0];
    }
    
    // Calculate most efficient project type
    const projectTypeService = require('./projectTypeService').projectTypeService;
    const projectTypeEfficiency = projectTypeService.getProjectTypeEfficiency(tasks, projects);
    let mostEfficientProjectType: string | undefined = undefined;
    
    if (projectTypeEfficiency.length > 0) {
      // Most efficient = highest completion rate
      mostEfficientProjectType = projectTypeEfficiency
        .sort((a, b) => b.completionRate - a.completionRate)[0]
        .projectType;
    }
    
    // Calculate project balance score
    // This measures how well distributed work is across projects
    // 100% = perfectly balanced, 0% = all work in one project
    let projectBalanceScore = 100;
    
    const projectIds = [...new Set(tasks.map(task => task.project_id))];
    if (projectIds.length > 1) {
      // Calculate percentage of tasks per project
      const taskCountByProject: Record<string, number> = {};
      projectIds.forEach(projectId => {
        taskCountByProject[projectId] = tasks.filter(task => task.project_id === projectId).length;
      });
      
      // Calculate standard deviation of task percentages
      const taskCounts = Object.values(taskCountByProject);
      const totalTasks = taskCounts.reduce((a, b) => a + b, 0);
      const projectPercentages = taskCounts.map(count => count / totalTasks);
      
      // Perfect balance would be 1/n for each of n projects
      const perfectPercentage = 1 / projectIds.length;
      
      // Calculate average deviation from perfect balance
      const deviations = projectPercentages.map(percentage => 
        Math.abs(percentage - perfectPercentage)
      );
      const averageDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
      
      // Convert to a score (0-100%)
      // Max possible deviation is (n-1)/n, where n-1 projects have 0% and 1 project has 100%
      const maxDeviation = (projectIds.length - 1) / projectIds.length;
      projectBalanceScore = Math.max(0, 100 * (1 - (averageDeviation / maxDeviation)));
    }
    
    // Calculate total tracked time
    const totalTrackedTime = tasksWithTimeData.reduce((total, task) => 
      total + (task.actual_time || 0), 0
    );
    
    return {
      taskCompletionRate: taskCompletionRate * 100, // Convert to percentage
      averageActualVsEstimated,
      mostProductiveDay,
      mostEfficientProjectType,
      estimationAccuracy,
      projectBalanceScore,
      totalCompletedTasks: completedTasks.length,
      totalTrackedTime
    };
  },
  
  /**
   * Determine if there is enough data for meaningful insights
   */
  hasEnoughDataForInsights(tasks: Task[], notes: any[]): boolean {
    // Need at least 5 tasks with 3 completed
    const completedTasks = tasks.filter(task => task.status === 'completed');
    if (tasks.length < 5 || completedTasks.length < 3) {
      return false;
    }
    
    // Need some time tracking data
    const tasksWithTimeData = completedTasks.filter(task => 
      task.estimated_time && task.actual_time !== undefined && task.actual_time > 0
    );
    if (tasksWithTimeData.length < 2) {
      return false;
    }
    
    return true;
  }
};

export default userInsightsService;