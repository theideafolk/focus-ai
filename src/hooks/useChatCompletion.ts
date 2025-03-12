import { useState } from 'react';

// OpenAI API URL and key
const OPENAI_API_URL_COMPLETIONS = 'https://api.openai.com/v1/chat/completions';
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export function useChatCompletion() {
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * Generate a chat completion using OpenAI API
   * @param systemPrompt - The system message to provide context
   * @param userPrompt - The current user message
   * @param conversationHistory - Previous messages in the conversation
   * @returns A Promise that resolves with the AI response text
   */
  const generateCompletion = async (
    systemPrompt: string,
    userPrompt: string,
    conversationHistory: Message[] = []
  ): Promise<string> => {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not set.');
    }

    setIsGenerating(true);

    try {
      // Prepare messages array with system, history, and current user message
      const messages: Message[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: userPrompt }
      ];

      // Call OpenAI API
      const response = await fetch(OPENAI_API_URL_COMPLETIONS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo-0125',
          messages,
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error generating chat completion:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateCompletion, isGenerating };
}