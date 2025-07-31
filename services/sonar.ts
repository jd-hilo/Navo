import Constants from 'expo-constants';

// Perplexity Sonar API Configuration - Optimized for Speed
const SONAR_API_CONFIG = {
  baseURL: 'https://api.perplexity.ai/chat/completions',
  model: 'sonar', // Faster model
  maxTokens: 1000, // Increased for comprehensive responses
  temperature: 0.1, // Lower temperature for faster, more focused responses
};

interface SonarResponse {
  response: string;
  success: boolean;
  error?: string;
  usage?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
  hasWebSearch?: boolean;
}

export const searchSonar = async (query: string): Promise<SonarResponse> => {
  try {
    console.log('🔍 Sonar request:', query);
    
    const apiKey = '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';
    
    if (!apiKey) {
      return {
        response: generateMockSonarResponse(query),
        success: false,
        error: 'API key not configured.',
        hasWebSearch: false,
      };
    }

    // Ultra-simple request for maximum speed
    const requestBody = {
      model: SONAR_API_CONFIG.model,
      messages: [
        {
          role: 'user',
          content: `${query}. Format: ^^ [summary] ^^ [details]`
        }
      ],
      max_tokens: SONAR_API_CONFIG.maxTokens,
      temperature: SONAR_API_CONFIG.temperature,
      top_p: 0.1, // Minimal for fastest responses
    };

    const response = await fetch(SONAR_API_CONFIG.baseURL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Sonar error:', response.status, errorData);
      
      return {
        response: generateMockSonarResponse(query),
        success: false,
        error: 'Sonar temporarily unavailable.',
        hasWebSearch: false,
      };
    }

    const data = await response.json();

    if (!data?.choices?.[0]?.message?.content) {
      return {
        response: generateMockSonarResponse(query),
        success: false,
        error: 'Invalid response from Sonar.',
        hasWebSearch: false,
      };
    }

    const content = data.choices[0].message.content;

    return {
      response: content.trim(),
      success: true,
      usage: data.usage ? {
        promptTokenCount: data.usage.prompt_tokens || 0,
        candidatesTokenCount: data.usage.completion_tokens || 0,
        totalTokenCount: data.usage.total_tokens || 0,
      } : undefined,
      hasWebSearch: false,
    };

  } catch (error: any) {
    console.error('❌ Sonar error:', error.message);
    
    return {
      response: generateMockSonarResponse(query),
      success: false,
      error: 'Network error. Please try again.',
      hasWebSearch: false,
    };
  }
};

export const generateMockSonarResponse = (query: string): string => {
  const responses = [
    `^^ This is a sample response about ${query} that demonstrates the expected format. ^^

Quick answer about ${query}: This is a sample response. Add your Sonar API key for real answers. The full response would include detailed information, explanations, and context about the topic you searched for.`,
    
    `^^ Sample response format for ${query} with proper structure. ^^

${query} - Sample response. Configure API key for live Sonar responses. This mock response shows how the real Perplexity Sonar API would format its answers with a summary at the top and detailed information below.`,
    
    `^^ Placeholder response demonstrating the required format for ${query}. ^^

Regarding ${query}: This is a placeholder. Get real answers by setting up your API key. The actual response would provide comprehensive information about your search query with proper formatting and structure.`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}; 