import { Note, AutoTagCategory, AUTO_TAG_CATEGORIES } from '../../types';
import { generateCompletion } from './openaiService';

export const noteTaggingService = {
  /**
   * Generate tags for a note using AI
   */
  async generateTags(note: Note): Promise<{ tags: AutoTagCategory[]; confidence: number }> {
    try {
      // Prepare the prompt for tag generation
      const prompt = `
Analyze this note and suggest appropriate tags from the following categories:
${AUTO_TAG_CATEGORIES.join(', ')}

Note content:
${note.content}

Return a JSON object with:
1. tags: array of most relevant tags (max 3)
2. confidence: number between 0 and 1 indicating confidence in the tags

Example: {"tags": ["to-do", "priority-context"], "confidence": 0.85}
`;

      // Get AI response
      const response = await generateCompletion(
        'You are an AI assistant that analyzes notes and assigns relevant tags.',
        prompt,
        []
      );

      // Parse the response
      const result = JSON.parse(response);

      // Validate tags
      const validTags = result.tags.filter((tag: string) => 
        AUTO_TAG_CATEGORIES.includes(tag as AutoTagCategory)
      );

      return {
        tags: validTags as AutoTagCategory[],
        confidence: Math.min(1, Math.max(0, result.confidence)) // Ensure between 0 and 1
      };
    } catch (error) {
      console.error('Error generating tags:', error);
      return { tags: [], confidence: 0 };
    }
  },

  /**
   * Analyze note content to determine tag relevance
   */
  async analyzeTagRelevance(note: Note, tag: string): Promise<number> {
    try {
      const prompt = `
Analyze this note and determine how relevant the tag "${tag}" is on a scale of 0 to 1.

Note content:
${note.content}

Return a single number between 0 and 1 representing the relevance.
`;

      const response = await generateCompletion(
        'You are an AI assistant that analyzes note content and tag relevance.',
        prompt,
        []
      );

      const relevance = parseFloat(response);
      return Math.min(1, Math.max(0, relevance)); // Ensure between 0 and 1
    } catch (error) {
      console.error('Error analyzing tag relevance:', error);
      return 0;
    }
  }
};