import { supabase } from '../../lib/supabase';
import type { Task, Project, UserSettings } from '../../types';

// Replace with your actual OpenAI API key and endpoint
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const OPENAI_API_URL_COMPLETIONS = 'https://api.openai.com/v1/chat/completions';

/**
 * Generate a daily sequence of tasks based on priorities and balance
 */
export async function generateDailyTaskSequence(
  tasks: Task[], 
  projects: Record<string, Project>,
  userSettings: UserSettings | null
): Promise<Task[]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not set. Cannot generate task sequence.');
  }
  
  if (tasks.length === 0) {
    return [];
  }
  
  try {
    // Build a context about projects and tasks
    let projectsContext = '';
    const projectIds = [...new Set(tasks.map(task => task.project_id))];
    const relevantProjects = projectIds
      .map(id => projects[id])
      .filter(Boolean);
      
    if (relevantProjects.length > 0) {
      projectsContext = 'Projects information:\n';
      relevantProjects.forEach((project, index) => {
        projectsContext += `Project ${index + 1}: "${project.name}"`;
        
        if (project.description) {
          projectsContext += ` - ${project.description}`;
        }
        
        if (project.end_date) {
          projectsContext += `, due on ${project.end_date}`;
        }
        
        projectsContext += `, priority: ${project.priority_score || 5}/10`;
        projectsContext += '\n';
      });
    }
    
    // Convert task data for the prompt
    const tasksData = tasks.map(task => ({
      id: task.id,
      description: task.description,
      project: task.project_id ? projects[task.project_id]?.name || 'Unknown' : 'No project',
      estimated_time: task.estimated_time,
      priority_score: task.priority_score || 5,
      due_date: task.due_date || 'No deadline',
      stage: task.stage || 'No stage',
      actual_time: task.actual_time
    }));
    
    // Add user settings context if available
    let userContext = '';
    if (userSettings) {
      userContext = 'User preferences:\n';
      
      // Add user's display name if available
      if (userSettings.workflow?.displayName) {
        userContext += `Name: ${userSettings.workflow.displayName}\n`;
      }
      
      // Add max daily hours
      if (userSettings.workflow?.maxDailyHours) {
        userContext += `Maximum daily work hours: ${userSettings.workflow.maxDailyHours}\n`;
      }
      
      // Add work days
      if (userSettings.workflow?.workDays && Array.isArray(userSettings.workflow.workDays)) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const workDayNames = userSettings.workflow.workDays.map(day => dayNames[day]);
        userContext += `Work days: ${workDayNames.join(', ')}\n`;
      }
      
      // Add skills
      if (userSettings.skills && Array.isArray(userSettings.skills)) {
        userContext += `Skills: ${JSON.stringify(userSettings.skills)}\n`;
      }
      
      // Add goals
      if (userSettings.workflow?.goals && Array.isArray(userSettings.workflow.goals)) {
        userContext += `Goals: ${JSON.stringify(userSettings.workflow.goals)}\n`;
      }
      
      // Add workflow stages
      if (userSettings.workflow?.stages && Array.isArray(userSettings.workflow.stages)) {
        userContext += `Workflow stages: ${JSON.stringify(userSettings.workflow.stages)}\n`;
      }
    }

    // Learning from actual time data
    let timeEstimateContext = '';
    const tasksWithActualTime = tasksData.filter(task => task.actual_time !== undefined);
    if (tasksWithActualTime.length > 0) {
      timeEstimateContext = 'Historical time data for learning:\n';
      tasksWithActualTime.forEach((task, index) => {
        const ratio = task.actual_time !== undefined ? task.actual_time / task.estimated_time : null;
        timeEstimateContext += `Task "${task.description}" was estimated at ${task.estimated_time} hours, but actually took ${task.actual_time} hours (${ratio !== null ? `${ratio.toFixed(2)}x ratio` : 'N/A'}).\n`;
      });
      
      timeEstimateContext += '\nPlease use this historical data to improve your estimates for similar tasks.\n';
    }
    
    // Build the prompt
    const prompt = `
I need help sequencing the following tasks for a balanced and productive day. Please create an optimal sequence that:
1. Balances work across different projects (no single project should dominate)
2. Prioritizes urgent items with upcoming deadlines
3. Considers task priority scores
4. Creates a realistic daily plan (maximum ${userSettings?.workflow?.maxDailyHours || 8} hours total unless absolutely necessary)
5. Groups similar tasks when it makes sense for flow
6. Considers the workflow stages, preferring to batch tasks from the same stage together

${projectsContext}

${userContext}

${timeEstimateContext}

Here are the tasks to sequence:
${JSON.stringify(tasksData, null, 2)}

Return a JSON object with a single "sequence" property containing an array of task IDs in the optimal order for today.
Example format: {"sequence": ["task-id-1", "task-id-2", "task-id-3"]}
`;

    // Call OpenAI API to generate sequence
    const response = await fetch(OPENAI_API_URL_COMPLETIONS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo-0125',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that helps with task prioritization and sequencing.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the response
    let sequence: string[] = [];
    try {
      const parsed = JSON.parse(content);
      sequence = parsed.sequence || [];
    } catch (parseError) {
      console.error('Error parsing OpenAI sequence response:', parseError);
      throw new Error('Failed to parse AI response for task sequencing');
    }
    
    // Map the sequence back to tasks
    const taskMap = new Map<string, Task>();
    tasks.forEach(task => taskMap.set(task.id, task));
    
    const sequencedTasks = sequence
      .map(id => taskMap.get(id))
      .filter(Boolean) as Task[];
      
    // If we didn't get all tasks in the sequence, add the missing ones at the end
    const sequencedIds = new Set(sequencedTasks.map(t => t.id));
    const missingTasks = tasks.filter(task => !sequencedIds.has(task.id));
    
    return [...sequencedTasks, ...missingTasks];
  } catch (error) {
    console.error('Error generating task sequence:', error);
    
    // Fall back to simple priority-based sorting
    return [...tasks].sort((a, b) => {
      // First by priority (higher first)
      const priorityDiff = (b.priority_score || 0) - (a.priority_score || 0);
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by due date (sooner first)
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      
      return 0;
    });
  }
}

/**
 * Learn from user task completion patterns
 * This function will analyze completed tasks to improve future estimations
 */
export async function learnFromTaskCompletion(
  taskId: string,
  actualTime: number
): Promise<void> {
  try {
    // Import from index to avoid circular dependency
    const { taskService } = require('../index');
    
    // Update the task with actual completion time
    await taskService.updateActualTime(taskId, actualTime);
    
    // In a more advanced implementation, we would:
    // 1. Store this data in a dedicated learning dataset
    // 2. Periodically retrain a model or update patterns
    // 3. Use these patterns to improve future estimates
    
    // For now, we're just storing the data in the tasks table
    // and will use it in the generateTasks and generateDailyTaskSequence functions
    console.log(`Stored learning data for task ${taskId}: actual time = ${actualTime}`);
  } catch (error) {
    console.error('Error learning from task completion:', error);
  }
}

export default {
  generateDailyTaskSequence,
  learnFromTaskCompletion
};