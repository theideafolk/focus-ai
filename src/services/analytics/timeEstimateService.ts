import type { Task, Project, TimeEstimateAccuracy } from '../../types';

/**
 * Service for analyzing time estimate accuracy
 */
export const timeEstimateService = {
  /**
   * Get accuracy of time estimates by task type
   */
  getTimeEstimateAccuracy(tasks: Task[], projects: Record<string, Project>): TimeEstimateAccuracy[] {
    // Need tasks with both estimated and actual time
    const completedTasksWithTime = tasks.filter(task => 
      task.status === 'completed' && 
      task.estimated_time && 
      task.actual_time !== undefined && 
      task.actual_time > 0
    );
    
    if (completedTasksWithTime.length < 3) {
      return [];
    }
    
    // Group tasks by project type
    const tasksByProjectType: Record<string, Task[]> = {};
    
    completedTasksWithTime.forEach(task => {
      const project = projects[task.project_id];
      const projectType = project?.project_type || 'unknown';
      
      if (!tasksByProjectType[projectType]) {
        tasksByProjectType[projectType] = [];
      }
      
      tasksByProjectType[projectType].push(task);
    });
    
    // Calculate accuracy for each project type
    return Object.entries(tasksByProjectType)
      .filter(([, tasks]) => tasks.length >= 2) // Need at least 2 tasks for meaningful data
      .map(([projectType, tasks]) => {
        // Calculate average times
        const estimatedTimes = tasks.map(task => task.estimated_time);
        const actualTimes = tasks.map(task => task.actual_time || 0);
        
        const avgEstimated = estimatedTimes.reduce((a, b) => a + b, 0) / estimatedTimes.length;
        const avgActual = actualTimes.reduce((a, b) => a + b, 0) / actualTimes.length;
        
        // Calculate ratios and convert to accuracy score
        const ratios = tasks.map(task => (task.actual_time || 0) / task.estimated_time);
        const accuracyScores = ratios.map(ratio => {
          const distance = Math.abs(ratio - 1);
          return Math.max(0, 100 - (distance * 50)); // 100% at ratio=1, 0% at ratio=3 or ratio=0
        });
        
        const avgAccuracy = accuracyScores.reduce((a, b) => a + b, 0) / accuracyScores.length;
        
        // Format project type name for display
        const displayType = projectType.split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        return {
          taskType: displayType,
          accuracyScore: avgAccuracy,
          averageEstimatedTime: avgEstimated,
          averageActualTime: avgActual,
          taskCount: tasks.length
        };
      })
      .sort((a, b) => b.taskCount - a.taskCount); // Sort by most tasks first
  },
  
  /**
   * Get the estimation style description for a user
   */
  getEstimationStyle(tasks: Task[]): string {
    const tasksWithTimeData = tasks.filter(task => 
      task.status === 'completed' && 
      task.estimated_time && 
      task.actual_time !== undefined && 
      task.actual_time > 0
    );
    
    if (tasksWithTimeData.length < 5) {
      return 'Not enough data';
    }
    
    const timeRatios = tasksWithTimeData.map(task => 
      (task.actual_time || 0) / task.estimated_time
    );
    
    const avgRatio = timeRatios.reduce((a, b) => a + b, 0) / timeRatios.length;
    
    if (avgRatio < 0.8) {
      return 'Overestimator (you finish faster than estimated)';
    } else if (avgRatio > 1.2) {
      return 'Underestimator (tasks take longer than estimated)';
    } else {
      return 'Balanced estimator (your estimates are quite accurate)';
    }
  }
};

export default timeEstimateService;