import type { Task, Project, Note, UserSettings } from '../../types';
import projectTypeService from './projectTypeService';
import timeEstimateService from './timeEstimateService';
import productivityService from './productivityService';

/**
 * Service for generating AI context about the user
 */
export const contextService = {
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
        workDays: productivityService.formatWorkDays(userSettings.workflow.workDays || [1, 2, 3, 4, 5]),
        stages: userSettings.workflow.stages || [],
        preferredCurrency: userSettings.workflow.preferredCurrency || 'USD'
      };
    }
    
    // Project information
    if (projects.length > 0) {
      context.projects = {
        count: projects.length,
        types: projectTypeService.getProjectTypeDistribution(projects),
        priorityRange: projectTypeService.getProjectPriorityRange(projects)
      };
    }
    
    // Task insights
    if (tasks.length > 0) {
      const completedTasks = tasks.filter(task => task.status === 'completed');
      const pendingTasks = tasks.filter(task => task.status === 'pending');
      
      context.insights = {
        completionRate: completedTasks.length > 0 ? 
          ((completedTasks.length / tasks.length) * 100).toFixed(0) + '%' : 'No data',
        estimationStyle: timeEstimateService.getEstimationStyle(tasks),
        taskCount: tasks.length,
        upcomingDeadlines: productivityService.getUpcomingDeadlines(pendingTasks)
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
  }
};

export default contextService;