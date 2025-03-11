import { Task, Project, UserSettings, Note, UserInsights, TimeEstimateAccuracy, ProjectTypeEfficiency, ProductivityByDay } from '../types';

/**
 * Service for analyzing user data and generating insights
 */
export const analyticsService = {
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
    const projectTypeEfficiency = this.getProjectTypeEfficiency(tasks, projects);
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
   * Get productivity metrics by day of week
   */
  getProductivityByDay(tasks: Task[]): ProductivityByDay[] {
    // Need tasks with completion timestamps
    const completedTasks = tasks.filter(task => 
      task.status === 'completed' && task.completed_at
    );
    
    if (completedTasks.length < 5) {
      return [];
    }
    
    // Group tasks by day of week
    const tasksByDay: Record<string, Task[]> = {
      'Monday': [], 'Tuesday': [], 'Wednesday': [], 'Thursday': [], 'Friday': [], 'Saturday': [], 'Sunday': []
    };
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    completedTasks.forEach(task => {
      if (task.completed_at) {
        const date = new Date(task.completed_at);
        const day = dayNames[date.getDay()];
        tasksByDay[day].push(task);
      }
    });
    
    // Calculate metrics for each day
    return Object.entries(tasksByDay)
      .filter(([, tasks]) => tasks.length > 0) // Only include days with tasks
      .map(([day, tasks]) => {
        const taskCount = tasks.length;
        
        // Calculate average time per task for tasks with actual time
        const tasksWithTime = tasks.filter(task => task.actual_time !== undefined && task.actual_time > 0);
        let averageTimePerTask = 0;
        
        if (tasksWithTime.length > 0) {
          const totalTime = tasksWithTime.reduce((total, task) => total + (task.actual_time || 0), 0);
          averageTimePerTask = totalTime / tasksWithTime.length;
        }
        
        return {
          day,
          taskCount,
          completedCount: taskCount, // All tasks here are completed
          averageTimePerTask
        };
      })
      .sort((a, b) => {
        // Sort by day of week order (Monday first)
        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
      });
  },
  
  /**
   * Get AI context about the user for display
   */
  getAIUserContext(userSettings: UserSettings | null, tasks: Task[], projects: Project[], notes: Note[]): Record<string, any> {
    const context: Record<string, any> = {
      skills: [],
      workPatterns: {},
      projects: {},
      insights: {}
    };
    
    // Extract user skills
    if (userSettings?.skills && Array.isArray(userSettings.skills)) {
      context.skills = userSettings.skills.map(skill => ({
        name: skill.name,
        proficiency: skill.proficiency,
        description: this.getSkillLevelDescription(skill.proficiency)
      }));
    }
    
    // Extract work patterns
    if (userSettings?.workflow) {
      context.workPatterns = {
        maxDailyHours: userSettings.workflow.maxDailyHours || 8,
        workDays: this.formatWorkDays(userSettings.workflow.workDays || [1, 2, 3, 4, 5]),
        stages: userSettings.workflow.stages || [],
        preferredCurrency: userSettings.workflow.preferredCurrency || 'USD'
      };
    }
    
    // Project information
    if (projects.length > 0) {
      context.projects = {
        count: projects.length,
        types: this.getProjectTypeDistribution(projects),
        priorityRange: this.getProjectPriorityRange(projects)
      };
    }
    
    // Task insights
    if (tasks.length > 0) {
      const completedTasks = tasks.filter(task => task.status === 'completed');
      const pendingTasks = tasks.filter(task => task.status === 'pending');
      
      context.insights = {
        completionRate: completedTasks.length > 0 ? 
          ((completedTasks.length / tasks.length) * 100).toFixed(0) + '%' : 'No data',
        estimationStyle: this.getEstimationStyle(tasks),
        taskCount: tasks.length,
        upcomingDeadlines: this.getUpcomingDeadlines(pendingTasks)
      };
    }
    
    // Note information
    if (notes.length > 0) {
      context.notes = {
        count: notes.length,
        averageLength: this.getAverageNoteLength(notes),
        detailLevel: this.getNoteDetailLevel(notes)
      };
    }
    
    return context;
  },
  
  /**
   * Format work days array into readable text
   */
  formatWorkDays(days: number[]): string {
    if (!days || days.length === 0) return 'None set';
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const sortedDays = [...days].sort((a, b) => a - b);
    
    return sortedDays.map(day => dayNames[day]).join(', ');
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
  },
  
  /**
   * Get user's estimation style based on task data
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
  },
  
  /**
   * Get upcoming deadlines from tasks
   */
  getUpcomingDeadlines(tasks: Task[]): { count: number, nearest?: string } {
    const now = new Date();
    const tasksWithDueDates = tasks.filter(task => task.due_date);
    
    if (tasksWithDueDates.length === 0) {
      return { count: 0 };
    }
    
    // Sort by due date (ascending)
    const sortedTasks = [...tasksWithDueDates].sort((a, b) => {
      const dateA = new Date(a.due_date!).getTime();
      const dateB = new Date(b.due_date!).getTime();
      return dateA - dateB;
    });
    
    // Get nearest upcoming due date
    const nearestDueDate = new Date(sortedTasks[0].due_date!);
    const daysUntil = Math.ceil((nearestDueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    return {
      count: tasksWithDueDates.length,
      nearest: daysUntil <= 0 ? 'Today' : `In ${daysUntil} days`
    };
  },
  
  /**
   * Get average note length in words
   */
  getAverageNoteLength(notes: Note[]): string {
    if (notes.length === 0) return 'No notes';
    
    const wordCounts = notes.map(note => {
      return note.content.split(/\s+/).filter(word => word.length > 0).length;
    });
    
    const avgWordCount = Math.round(wordCounts.reduce((a, b) => a + b, 0) / notes.length);
    
    if (avgWordCount < 30) {
      return 'Brief notes (average less than 30 words)';
    } else if (avgWordCount < 100) {
      return 'Medium-length notes (average 30-100 words)';
    } else {
      return 'Detailed notes (average more than 100 words)';
    }
  },
  
  /**
   * Assess the detail level of notes
   */
  getNoteDetailLevel(notes: Note[]): string {
    if (notes.length < 3) return 'Not enough notes to determine';
    
    // Check for typical markers of detail
    const detailMarkers = ['because', 'therefore', 'however', 'additionally', 'specifically'];
    let detailScore = 0;
    
    notes.forEach(note => {
      const content = note.content.toLowerCase();
      detailMarkers.forEach(marker => {
        if (content.includes(marker)) {
          detailScore++;
        }
      });
      
      // Check for numerical details
      if (/\d+([.,%]\d+)?/.test(content)) {
        detailScore++;
      }
      
      // Check for lists (bullet points or numbered)
      if (/(\n- |\n\d+\. )/.test(content)) {
        detailScore += 2;
      }
    });
    
    const averageScore = detailScore / notes.length;
    
    if (averageScore < 0.5) {
      return 'High-level notes (few specific details)';
    } else if (averageScore < 1.5) {
      return 'Balanced notes (mix of high-level and detailed)';
    } else {
      return 'Detailed notes (rich with specifics)';
    }
  },
  
  /**
   * Get description for skill proficiency level
   */
  getSkillLevelDescription(level: number): string {
    switch(level) {
      case 1: return 'Beginner';
      case 2: return 'Basic';
      case 3: return 'Intermediate';
      case 4: return 'Advanced';
      case 5: return 'Expert';
      default: return 'Unknown';
    }
  },
  
  /**
   * Determine if there is enough data for meaningful insights
   */
  hasEnoughDataForInsights(tasks: Task[], notes: Note[]): boolean {
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