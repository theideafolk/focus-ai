// Replace with your actual OpenAI API key and endpoint
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const OPENAI_API_URL_COMPLETIONS = 'https://api.openai.com/v1/chat/completions';

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

/**
 * Generate a chat completion using OpenAI API
 */
export async function generateCompletion(
  systemPrompt: string,
  userPrompt: string,
  conversationHistory: Message[] = []
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not set.');
  }

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
        model: 'gpt-4o-mini',
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
  }
}

export default {
  generateCompletion
};