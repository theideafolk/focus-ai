import { supabase } from '../../lib/supabase';
import { taskService } from '../index';
import type { Note, Task, Project, UserSettings } from '../../types';

// Replace with your actual OpenAI API key and endpoint
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const OPENAI_API_URL_COMPLETIONS = 'https://api.openai.com/v1/chat/completions';

/**
 * Generate tasks based on project details and context
 */
interface GenerateTasksOptions {
  project?: Project;
  context?: string;
  numTasks?: number;
  timespan?: string; // String representation for prompt (e.g., "3 days")
  timespanUnit?: 'day' | 'week' | 'month'; // Unit type
  timespanValue?: number; // Numerical value
  userSettings?: UserSettings | null;
}

export async function generateTasks(options: GenerateTasksOptions): Promise<Task[]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not set. Cannot generate tasks.');
  }
  
  const { 
    project, 
    context, 
    numTasks, 
    timespan = 'week', 
    timespanUnit = 'week', 
    timespanValue = 1, 
    userSettings 
  } = options;
  
  try {
    // First, get relevant notes and documentation for context
    let relevantNotes: Note[] = [];
    let projectDocs: Array<{ title: string; content: string }> = [];
    
    if (project) {
      // Get notes associated with this project
      const { data: projectNotes, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (!notesError && projectNotes) {
        relevantNotes = projectNotes;
      }
      
      // Get documentation from the project if available
      if (project.documentation && Array.isArray(project.documentation)) {
        projectDocs = project.documentation;
      }
    } else {
      // Get some recent notes for general context
      const { data: recentNotes, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (!notesError && recentNotes) {
        relevantNotes = recentNotes;
      }
      
      // Get documentation from all projects
      const { data: allProjects, error: projectsError } = await supabase
        .from('projects')
        .select('documentation')
        .not('documentation', 'is', null);
        
      if (!projectsError && allProjects) {
        allProjects.forEach(p => {
          if (p.documentation && Array.isArray(p.documentation)) {
            projectDocs = [...projectDocs, ...p.documentation];
          }
        });
      }
    }
    
    // Calculate estimated due dates based on timespan
    const now = new Date();
    let endDate: Date;
    
    if (timespanUnit === 'day') {
      endDate = new Date(now.getTime() + (timespanValue * 24 * 60 * 60 * 1000));
    } else if (timespanUnit === 'week') {
      endDate = new Date(now.getTime() + (timespanValue * 7 * 24 * 60 * 60 * 1000));
    } else { // month
      // Add months by setting the date directly (handles month transitions)
      endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + timespanValue);
    }
    
    // Build prompt for the AI
    let prompt = `Generate specific, actionable tasks`;
    
    if (project) {
      prompt += ` for the project "${project.name}"`;
      
      if (project.description) {
        prompt += ` which is described as: "${project.description}"`;
      }
      
      if (project.start_date && project.end_date) {
        prompt += ` with timeline from ${project.start_date} to ${project.end_date}`;
      } else if (project.start_date) {
        prompt += ` which started on ${project.start_date}`;
      } else if (project.end_date) {
        prompt += ` which is due on ${project.end_date}`;
      }
    } else {
      prompt += ` balanced across multiple projects`;
    }
    
    prompt += ` for a timespan of ${timespan}.`;
    
    if (context) {
      prompt += ` Additional context: ${context}`;
    }
    
    // Add project documentation context
    let contextInstructions = '';
    if (projectDocs.length > 0 || relevantNotes.length > 0) {
      contextInstructions = `\n\nIMPORTANT: I'll provide you with relevant documentation and notes below. DO NOT simply reference them in your tasks (e.g., DO NOT create tasks like "Review feedback from Note 1"). Instead:
1. Carefully read and understand the content of each document/note
2. Extract specific, actionable items mentioned in them
3. Create detailed, concrete tasks based on the actual content
4. Convert vague ideas into specific deliverables
5. Make each task self-contained with all necessary context (don't require the user to refer back to the original notes)`;
      
      prompt += contextInstructions;
      
      prompt += `\n\nRelevant project documentation for context:\n`;
      projectDocs.slice(0, 3).forEach((doc, index) => {
        prompt += `Documentation "${doc.title}": ${doc.content.substring(0, 500)}\n\n`;
      });
    }
    
    // Add notes context with explicit instructions
    if (relevantNotes.length > 0) {
      prompt += `\n\nRelevant notes for context (extract actionable items from these):\n`;
      relevantNotes.forEach((note, index) => {
        prompt += `Note titled "${note.title || 'Untitled'}": ${note.content.substring(0, 500)}\n\n`;
      });
    }

    // Add user settings context
    if (userSettings) {
      // Add user goals
      if (userSettings.workflow?.goals && Array.isArray(userSettings.workflow.goals)) {
        prompt += `\n\nUser goals:\n`;
        const shortTermGoals = userSettings.workflow.goals.filter(g => g.timeframe === 'short-term');
        const longTermGoals = userSettings.workflow.goals.filter(g => g.timeframe === 'long-term');
        
        if (shortTermGoals.length > 0) {
          prompt += `Short-term goals:\n`;
          shortTermGoals.forEach((goal, index) => {
            prompt += `- ${goal.description}\n`;
          });
        }
        
        if (longTermGoals.length > 0) {
          prompt += `Long-term goals:\n`;
          longTermGoals.forEach((goal, index) => {
            prompt += `- ${goal.description}\n`;
          });
        }
      }
      
      // Add user skills
      if (userSettings.skills && Array.isArray(userSettings.skills)) {
        prompt += `\n\nUser skills:\n`;
        userSettings.skills.forEach((skill) => {
          prompt += `- ${skill.name}: Proficiency level ${skill.proficiency}/5\n`;
        });
      }
      
      // Add workflow stages
      if (userSettings.workflow?.stages && Array.isArray(userSettings.workflow.stages)) {
        prompt += `\n\nUser workflow stages:\n`;
        userSettings.workflow.stages.forEach((stage, index) => {
          prompt += `${index + 1}. ${stage.name}${stage.description ? `: ${stage.description}` : ''}\n`;
        });
        
        // Instruct the AI to assign stages to tasks
        prompt += `\nPlease assign an appropriate workflow stage to each task based on the user's workflow stages listed above.`;
      }
    }
    
    // Add timespan guidance specific to the chosen duration
    prompt += `\n\nThe tasks should be spread appropriately over the specified timespan of ${timespan}. Ensure due dates are reasonable and evenly distributed within this period (starting from today: ${now.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}).`;
    
    // Add more clarity on the task requirements
    prompt += `\n\nTask Requirements:
1. Each task must be SPECIFIC and ACTIONABLE - it should be clear what needs to be done without needing additional context
2. Use concrete verbs and clear deliverables (e.g., "Create user flow diagram for checkout process" NOT "Think about checkout")
3. Include enough context within each task description (e.g., "Implement feedback form with 5 questions about UI experience" NOT "Implement feedback form")
4. Break down vague requests into concrete steps
5. If notes mention feedback or requests, extract the SPECIFIC items rather than just saying "address feedback"
6. Avoid references to source notes/documents in task descriptions - incorporate the relevant details directly

For each task, provide:
1. A clear, actionable description as described above
2. An estimated time in hours (realistic, between 0.5 and 8 hours)
3. A priority score (1-10, where 10 is highest priority)
4. A due date (relative to today, within the specified ${timespan} timespan)
5. A workflow stage (from the user's workflow stages, if available)

Format your response as a JSON array of task objects with these properties:
- description (string)
- estimated_time (number)
- priority_score (number)
- due_date (string in YYYY-MM-DD format)
- stage (string, matching one of the user's workflow stages if provided)
`;

    // Call OpenAI API to generate tasks
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
            content: 'You are an AI assistant that helps with task generation and project management. Generate specific, actionable tasks with realistic time estimates. Your primary focus is to create highly detailed, concrete tasks that incorporate all relevant context, without requiring users to refer back to original source materials.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
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
    let parsedTasks = [];
    try {
      const parsed = JSON.parse(content);
      parsedTasks = parsed.tasks || [];
      
      if (!parsedTasks.length && Array.isArray(parsed)) {
        parsedTasks = parsed;
      }
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      
      // Fall back to simple tasks if parsing fails
      return generateSimpleTasks(project, numTasks, timespanUnit, timespanValue, userSettings);
    }
    
    // Create task objects (but don't save to the database yet)
    const tasks: Task[] = [];
    
    for (const taskData of parsedTasks) {
      // Validate task data
      const description = taskData.description || 'New task';
      const estimated_time = parseFloat(taskData.estimated_time) || 1;
      const priority_score = parseInt(taskData.priority_score) || 5;
      const due_date = taskData.due_date || null;
      const stage = taskData.stage || null;
      
      // Generate a temporary ID
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      tasks.push({
        id: tempId,
        project_id: project?.id || '',
        description,
        estimated_time,
        priority_score,
        due_date,
        stage,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    return tasks;
  } catch (error) {
    console.error('Error generating tasks:', error);
    
    // Fall back to simple tasks if OpenAI API fails
    return generateSimpleTasks(project, numTasks, timespanUnit, timespanValue, userSettings);
  }
}

/**
 * Break down a task into smaller subtasks
 */
export async function breakdownTask(task: Task): Promise<Task[]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not set. Cannot break down task.');
  }
  
  try {
    // Prepare a prompt for the AI
    const prompt = `Break down this task into 2-4 smaller, more specific subtasks: "${task.description}"

Each subtask should be:
1. Concrete and actionable - even more specific than the original task
2. Self-contained with clear outcomes/deliverables 
3. A logical step towards completing the original task
4. Have realistic time estimates that sum up to approximately ${task.estimated_time} hours
5. Be part of the same workflow stage (${task.stage || 'no stage specified'})

IMPORTANT: Avoid vague subtasks like "review" or "think about". Instead, create specific actionable items with clear deliverables.

Format your response as a JSON array of subtask objects with these properties:
- description (string)
- estimated_time (number)
- priority_score (number, similar to the original task's priority of ${task.priority_score || 5})
- due_date (string in YYYY-MM-DD format, should be on or before the original task's due date of ${task.due_date || 'not specified'})
- stage (string, should be "${task.stage || ''}")
`;

    // Call OpenAI API to break down the task
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
            content: 'You are an AI assistant that helps break down tasks into smaller, specific, and actionable subtasks. Create subtasks that are concrete, with clear deliverables, and require no additional context to understand.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 1000,
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
    let parsedSubtasks = [];
    try {
      const parsed = JSON.parse(content);
      parsedSubtasks = parsed.subtasks || [];
      
      if (!parsedSubtasks.length && Array.isArray(parsed)) {
        parsedSubtasks = parsed;
      }
    } catch (parseError) {
      console.error('Error parsing OpenAI response for subtasks:', parseError);
      throw new Error('Failed to break down task');
    }
    
    // Create subtask objects
    const subtasks: Task[] = [];
    
    for (const subtaskData of parsedSubtasks) {
      // Generate a temporary ID
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      subtasks.push({
        id: tempId,
        project_id: task.project_id,
        description: subtaskData.description || `Subtask of ${task.description}`,
        estimated_time: parseFloat(subtaskData.estimated_time) || (task.estimated_time / parsedSubtasks.length),
        priority_score: parseInt(subtaskData.priority_score) || task.priority_score,
        due_date: subtaskData.due_date || task.due_date,
        stage: subtaskData.stage || task.stage,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    return subtasks;
  } catch (error) {
    console.error('Error breaking down task:', error);
    
    // Fall back to simple breakdown
    return [
      {
        id: `temp-${Date.now()}-1`,
        project_id: task.project_id,
        description: `Plan for: ${task.description}`,
        estimated_time: task.estimated_time * 0.3,
        priority_score: task.priority_score,
        due_date: task.due_date,
        stage: task.stage,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: `temp-${Date.now()}-2`,
        project_id: task.project_id,
        description: `Implement: ${task.description}`,
        estimated_time: task.estimated_time * 0.5,
        priority_score: task.priority_score,
        due_date: task.due_date,
        stage: task.stage,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: `temp-${Date.now()}-3`,
        project_id: task.project_id,
        description: `Review and finalize: ${task.description}`,
        estimated_time: task.estimated_time * 0.2,
        priority_score: task.priority_score,
        due_date: task.due_date,
        stage: task.stage,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }
}

/**
 * Simple fallback for task generation without AI
 */
function generateSimpleTasks(
  project?: Project, 
  numTasks = 5, 
  timespanUnit: 'day' | 'week' | 'month' = 'week', 
  timespanValue = 1,
  userSettings?: UserSettings | null
): Promise<Task[]> {
  return new Promise(async (resolve) => {
    const createdTasks: Task[] = [];
    const defaultTasks = [
      'Research and gather requirements',
      'Create initial design',
      'Implement core functionality',
      'Test and fix issues',
      'Prepare documentation',
      'Review and finalize',
      'Present to stakeholders',
      'Gather feedback',
      'Make revisions',
      'Deploy to production'
    ];
    
    // Get workflow stages if available
    let stages: string[] = [];
    if (userSettings?.workflow?.stages && Array.isArray(userSettings.workflow.stages)) {
      stages = userSettings.workflow.stages.map(stage => stage.name);
    }
    
    // Calculate number of days based on timespan
    let days = 7;
    if (timespanUnit === 'day') {
      days = timespanValue;
    } else if (timespanUnit === 'week') {
      days = timespanValue * 7;
    } else if (timespanUnit === 'month') {
      days = timespanValue * 30;
    }
    
    // Create tasks
    for (let i = 0; i < Math.min(numTasks || 5, defaultTasks.length); i++) {
      const description = project 
        ? `${defaultTasks[i]} for ${project.name}`
        : defaultTasks[i];
        
      const estimated_time = 1 + Math.floor(Math.random() * 4); // 1-4 hours
      const priority_score = 10 - i; // Higher priority for earlier tasks
      
      // Generate due date within the timespan
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * days) + 1);
      const due_date = dueDate.toISOString().split('T')[0];
      
      // Assign a stage if available
      const stage = stages.length > 0 ? stages[i % stages.length] : undefined;
      
      // Generate a temporary ID
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      createdTasks.push({
        id: tempId,
        project_id: project?.id || '',
        description,
        estimated_time,
        priority_score,
        due_date,
        stage,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    resolve(createdTasks);
  });
}

export default {
  generateTasks,
  breakdownTask
};