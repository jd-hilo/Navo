import Constants from 'expo-constants';

// Perplexity Sonar API Configuration - Optimized for Speed
const SONAR_API_CONFIG = {
  baseURL: 'https://api.perplexity.ai/chat/completions',
  model: 'sonar', // Use sonar model
  maxTokens: 400, // Increased for more comprehensive responses
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
  sources?: Array<{
    title: string;
    url: string;
    domain: string;
  }>;
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

    // Request with web search enabled
    const requestBody = {
      model: SONAR_API_CONFIG.model,
      messages: [
        {
          role: 'user',
          content: `Answer: ${query}. 

Format: ^^ [2-3 sentence summary] ^^ [detailed explanation]

Keep the summary concise and clean without citation numbers.`
        }
      ],
      max_tokens: 400,
      temperature: 0.1,
      top_p: 0.1,
      stream: false,
      search_domain_filter: [], // Allow all domains
      include_search_results: true, // Enable web search
    };

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(SONAR_API_CONFIG.baseURL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Sonar error:', response.status, errorData);
      
      return {
        response: generateMockSonarResponse(query),
        success: false,
        error: 'Sonar temporarily unavailable.',
        hasWebSearch: false,
        sources: undefined,
      };
    }

    const data = await response.json();

    if (!data?.choices?.[0]?.message?.content) {
      return {
        response: generateMockSonarResponse(query),
        success: false,
        error: 'Invalid response from Sonar.',
        hasWebSearch: false,
        sources: undefined,
      };
    }

    const content = data.choices[0].message.content;
    
    // Extract sources from the response if available
    let sources = [];
    if (data.search_results && Array.isArray(data.search_results)) {
      sources = data.search_results.map((result: any) => ({
        title: result.title || '',
        url: result.url || '',
        domain: result.url ? new URL(result.url).hostname : '',
      }));
    }

    console.log('🔍 Sonar response:', content);
    console.log('🔍 Sonar sources:', sources);

    return {
      response: content.trim(),
      success: true,
      usage: data.usage ? {
        promptTokenCount: data.usage.prompt_tokens || 0,
        candidatesTokenCount: data.usage.completion_tokens || 0,
        totalTokenCount: data.usage.total_tokens || 0,
      } : undefined,
      hasWebSearch: sources.length > 0,
      sources: sources.length > 0 ? sources : undefined,
    };

  } catch (error: any) {
    console.error('❌ Sonar error:', error.message);
    
    // Handle timeout specifically
    if (error.name === 'AbortError') {
          return {
      response: generateMockSonarResponse(query),
      success: false,
      error: 'Request timed out. Please try again.',
      hasWebSearch: false,
      sources: undefined,
    };
    }
    
    return {
      response: generateMockSonarResponse(query),
      success: false,
      error: 'Network error. Please try again.',
      hasWebSearch: false,
      sources: undefined,
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