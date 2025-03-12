// Re-export all services for backward compatibility
import { 
  projectService,
  noteService,
  taskService,
  userSettingsService,
  userStreakService,
  aiContextService
} from './services/index';

import {
  processTextForEmbedding,
  generateEmbeddings,
  storeNoteEmbedding,
  searchSimilarNotes,
  generateTasks,
  breakdownTask,
  generateDailyTaskSequence,
  learnFromTaskCompletion
} from './services/ai/index';

// Export all services under the same names as the old structure
export {
  // Database services
  projectService,
  noteService,
  taskService,
  userSettingsService,
  userStreakService,
  aiContextService,
  
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