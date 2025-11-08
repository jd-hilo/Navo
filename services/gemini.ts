import Constants from 'expo-constants';

// Google Gemini API Configuration - Optimized for Speed
const GEMINI_API_CONFIG = {
  baseURL: 'https://generativelanguage.googleapis.com/v1beta',
  model: 'gemini-1.5-flash',
  maxTokens: 700, // Increased to allow full responses without cutoff
  temperature: 0.3, // Lower temperature for faster, more focused responses
};

interface GeminiResponse {
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

export const searchGemini = async (query: string): Promise<GeminiResponse> => {
  try {
    console.log('🔍 Gemini request:', query);
    
    const apiKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return {
        response: generateMockGeminiResponse(query),
        success: false,
        error: 'API key not configured.',
        hasWebSearch: false,
      };
    }

    // Request with proper formatting instructions
    const requestBody = {
      contents: [{
        parts: [{
          text: `Provide a brief answer about: ${query}

Format your response exactly like this:
^^ Brief summary (2-3 sentences maximum) ^^ Detailed explanation with more information

Keep the summary concise and the details informative.`
        }]
      }],
      generationConfig: {
        temperature: GEMINI_API_CONFIG.temperature,
        maxOutputTokens: GEMINI_API_CONFIG.maxTokens,
        topP: 0.5, // Reduced for faster responses
        topK: 20, // Reduced for faster responses
      }
    };

    const response = await fetch(`${GEMINI_API_CONFIG.baseURL}/models/${GEMINI_API_CONFIG.model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Gemini error:', response.status, errorData);
      
      return {
        response: generateMockGeminiResponse(query),
        success: false,
        error: 'Gemini temporarily unavailable.',
        hasWebSearch: false,
      };
    }

    const data = await response.json();

    if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return {
        response: generateMockGeminiResponse(query),
        success: false,
        error: 'Invalid response from Gemini.',
        hasWebSearch: false,
      };
    }

    const content = data.candidates[0].content.parts[0].text;

    return {
      response: content.trim(),
      success: true,
      usage: data.usageMetadata ? {
        promptTokenCount: data.usageMetadata.promptTokenCount || 0,
        candidatesTokenCount: data.usageMetadata.candidatesTokenCount || 0,
        totalTokenCount: data.usageMetadata.totalTokenCount || 0,
      } : undefined,
      hasWebSearch: false,
    };

  } catch (error: any) {
    console.error('❌ Gemini error:', error.message);
    
    return {
      response: generateMockGeminiResponse(query),
      success: false,
      error: 'Network error. Please try again.',
      hasWebSearch: false,
    };
  }
};

export const generateMockGeminiResponse = (query: string): string => {
  const responses = [
    `Quick answer about ${query}: This is a sample response. Add your Gemini API key for real answers.`,
    `${query} - Sample response. Configure API key for live Gemini responses.`,
    `Regarding ${query}: This is a placeholder. Get real answers by setting up your API key.`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
};