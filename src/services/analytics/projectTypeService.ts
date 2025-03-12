import type { Task, Project, ProjectTypeEfficiency } from '../../types';

/**
 * Service for analyzing project type efficiency
 */
export const projectTypeService = {
  /**
   * Get efficiency metrics by project type
   */
  getProjectTypeEfficiency(tasks: Task[], projects: Record<string, Project>): ProjectTypeEfficiency[] {
    if (tasks.length < 5) {
      return [];
    }
    
    // Group tasks by project type
    const tasksByProjectType: Record<string, Task[]> = {};
    
    tasks.forEach(task => {
      const project = projects[task.project_id];
      const projectType = project?.project_type || 'unknown';
      
      if (!tasksByProjectType[projectType]) {
        tasksByProjectType[projectType] = [];
      }
      
      tasksByProjectType[projectType].push(task);
    });
    
    // Calculate metrics for each project type
    return Object.entries(tasksByProjectType)
      .filter(([, tasks]) => tasks.length >= 3) // Need at least 3 tasks for meaningful data
      .map(([projectType, tasks]) => {
        const taskCount = tasks.length;
        const completedCount = tasks.filter(task => task.status === 'completed').length;
        const completionRate = (completedCount / taskCount) * 100;
        
        // Calculate time ratio (actual/estimated) for completed tasks with time data
        const tasksWithTimeData = tasks.filter(task => 
          task.status === 'completed' && 
          task.estimated_time && 
          task.actual_time !== undefined && 
          task.actual_time > 0
        );
        
        let averageTimeRatio = 1;
        
        if (tasksWithTimeData.length > 0) {
          const timeRatios = tasksWithTimeData.map(task => 
            (task.actual_time || 0) / task.estimated_time
          );
          averageTimeRatio = timeRatios.reduce((a, b) => a + b, 0) / timeRatios.length;
        }
        
        // Format project type name for display
        const displayType = projectType.split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        return {
          projectType: displayType,
          taskCount,
          completedCount,
          completionRate,
          averageTimeRatio
        };
      })
      .sort((a, b) => b.completionRate - a.completionRate); // Sort by completion rate
  },
  
  /**
   * Get distribution of project types
   */
  getProjectTypeDistribution(projects: Project[]): Record<string, number> {
    const typeCounts: Record<string, number> = {};
    
    projects.forEach(project => {
      const type = project.project_type || 'unspecified';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    return typeCounts;
  },
  
  /**
   * Get range of project priorities
   */
  getProjectPriorityRange(projects: Project[]): { min: number, max: number, avg: number } {
    const priorities = projects
      .map(project => project.priority_score || 0)
      .filter(score => score > 0);
    
    if (priorities.length === 0) {
      return { min: 0, max: 0, avg: 0 };
    }
    
    return {
      min: Math.min(...priorities),
      max: Math.max(...priorities),
      avg: priorities.reduce((a, b) => a + b, 0) / priorities.length
    };
  }
};

export default projectTypeService;