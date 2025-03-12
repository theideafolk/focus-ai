import type { Task, ProductivityByDay } from '../../types';

/**
 * Service for analyzing productivity patterns
 */
export const productivityService = {
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
   * Format work days array into readable text
   */
  formatWorkDays(days: number[]): string {
    if (!days || days.length === 0) return 'None set';
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const sortedDays = [...days].sort((a, b) => a - b);
    
    return sortedDays.map(day => dayNames[day]).join(', ');
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
  }
};

export default productivityService;