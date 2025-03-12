import embeddingService from './embeddingService';
import taskGenerationService from './taskGenerationService';
import taskSequenceService from './taskSequenceService';

// Export individual functions for direct imports
export const {
  processTextForEmbedding,
  generateEmbeddings,
  storeNoteEmbedding,
  searchSimilarNotes
} = embeddingService;

export const {
  generateTasks,
  breakdownTask
} = taskGenerationService;

export const {
  generateDailyTaskSequence,
  learnFromTaskCompletion
} = taskSequenceService;

// Export service objects for importing the entire module
export {
  embeddingService,
  taskGenerationService,
  taskSequenceService
};