// Import and re-export all service modules
import projectService from './project/projectService';
import noteService from './note/noteService';
import taskService from './task/taskService';
import userSettingsService from './user/userSettingsService';
import userStreakService from './user/userStreakService';
import aiContextService from './ai/aiContextService';
import documentService from './document/documentService';

// Import AI services
import { 
  processTextForEmbedding,
  generateEmbeddings,
  storeNoteEmbedding,
  searchSimilarNotes,
  generateTasks,
  breakdownTask,
  generateDailyTaskSequence,
  learnFromTaskCompletion
} from './ai';

// Export as named exports
export {
  // Database services
  projectService,
  noteService,
  taskService,
  userSettingsService,
  userStreakService,
  aiContextService,
  documentService,
  
  // AI functions
  processTextForEmbedding,
  generateEmbeddings,
  storeNoteEmbedding,
  searchSimilarNotes,
  generateTasks,
  breakdownTask,
  generateDailyTaskSequence,
  learnFromTaskCompletion
};