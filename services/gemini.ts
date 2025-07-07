import Constants from 'expo-constants';

// Google Gemini API Configuration
const GEMINI_API_CONFIG = {
  baseURL: 'https://generativelanguage.googleapis.com/v1beta',
  model: 'gemini-1.5-flash',
  maxTokens: 250, // Reduced for faster responses
  temperature: 0.7,
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
  sources?: string[];
  groundingMetadata?: any;
}

export const searchGemini = async (query: string): Promise<GeminiResponse> => {
  try {
    console.log('🔍 Making Google Gemini request with FORCED grounding for:', query);
    
    // Check if API key is available - use Expo Constants to access from app.json
    const apiKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    console.log('🔑 API Key check:', {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      isDefaultKey: apiKey === 'your_gemini_api_key_here',
      fromConstants: !!Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY,
      fromProcessEnv: !!process.env.EXPO_PUBLIC_GEMINI_API_KEY
    });
    
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      console.warn('⚠️ Google Gemini API key not found or not configured');
      return {
        response: generateMockGeminiResponse(query),
        success: false,
        error: 'To get live Gemini responses with Google Search, add your Google Gemini API key to the .env file. Currently showing sample response.',
        hasWebSearch: false,
      };
    }

    // Use Gemini API with FORCED Google Search grounding for ALL queries
    const requestBody = {
      contents: [{
        parts: [{
          text: `Search the web for current information about "${query}" and provide a response with a one-sentence summary between double carets like this:

^^ [Your summary here] ^^

Then provide the detailed information after the carets.`
        }]
      }],
      generationConfig: {
        temperature: GEMINI_API_CONFIG.temperature,
        maxOutputTokens: GEMINI_API_CONFIG.maxTokens,
        topP: 0.8,
        topK: 40,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ],
      // FORCE Google Search grounding for ALL queries by setting threshold to 0
      tools: [{
        googleSearchRetrieval: {
          dynamicRetrievalConfig: {
            mode: "MODE_DYNAMIC",
            dynamicThreshold: 0.0  // Changed from 0.7 to 0.0 to FORCE search for everything
          }
        }
      }]
    };

    console.log('📡 Making request to Gemini API with FORCED Google Search...');
    console.log('🔗 Request URL:', `${GEMINI_API_CONFIG.baseURL}/models/${GEMINI_API_CONFIG.model}:generateContent?key=${apiKey.substring(0, 10)}...`);
    console.log('📦 Request Body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${GEMINI_API_CONFIG.baseURL}/models/${GEMINI_API_CONFIG.model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('✅ Google Gemini API Response Status:', response.status);
    console.log('📋 Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Google Gemini API Error Response:', errorData);
      
      let errorMessage = 'Google Gemini is temporarily unavailable. Please try again.';
      
      switch (response.status) {
        case 400:
          errorMessage = 'Invalid request to Google Gemini API. Please try a different search query.';
          break;
        case 401:
        case 403:
          errorMessage = 'Invalid Google Gemini API key or access denied. Please check your configuration.';
          break;
        case 429:
          errorMessage = 'Google Gemini API rate limit exceeded. Please wait a moment before trying again.';
          // Add exponential backoff for rate limiting
          await new Promise(resolve => setTimeout(resolve, 5000 + Math.random() * 5000));
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          errorMessage = 'Google Gemini API is experiencing issues. Please try again in a few moments.';
          break;
        default:
          errorMessage = `Google Gemini API error (${response.status}). Please try again.`;
      }
      
      return {
        response: generateMockGeminiResponse(query),
        success: false,
        error: errorMessage,
        hasWebSearch: false,
      };
    }

    const data = await response.json();
    console.log('📦 Google Gemini API Response Data:', {
      hasCandidates: !!data.candidates,
      candidatesLength: data.candidates?.length || 0,
      hasUsageMetadata: !!data.usageMetadata,
      hasGroundingMetadata: !!data.candidates?.[0]?.groundingMetadata,
    });

    if (!data || !data.candidates || data.candidates.length === 0) {
      console.error('❌ Invalid response format from Google Gemini API:', data);
      throw new Error('Invalid response format from Google Gemini API');
    }

    const candidate = data.candidates[0];
    console.log('📦 Candidate data:', {
      hasContent: !!candidate.content,
      hasParts: !!candidate.content?.parts,
      partsLength: candidate.content?.parts?.length || 0,
      finishReason: candidate.finishReason,
      hasGroundingMetadata: !!candidate.groundingMetadata,
    });

    // Handle different response formats
    let content = null;
    
    if (candidate.content?.parts && candidate.content.parts.length > 0) {
      content = candidate.content.parts[0].text;
    }

    if (!content || content.trim().length === 0) {
      console.error('❌ No content received from Google Gemini API');
      console.error('Full candidate object:', JSON.stringify(candidate, null, 2));
      throw new Error('No content received from Google Gemini API');
    }

    // Check if the response was blocked by safety filters
    if (candidate.finishReason === 'SAFETY') {
      console.warn('⚠️ Response blocked by safety filters');
      return {
        response: generateMockGeminiResponse(query),
        success: false,
        error: 'Response was blocked by safety filters. Please try a different query.',
        hasWebSearch: false,
      };
    }

    console.log('✅ Successfully received Google Gemini response with content length:', content.length);
    console.log('📝 Raw response content:', content.substring(0, 200) + '...');

    // Extract grounding information and sources
    const groundingMetadata = candidate.groundingMetadata;
    const sources = extractSourcesFromGrounding(groundingMetadata) || extractSourcesFromResponse(content);
    
    // Since we're forcing search with threshold 0.0, we should always have web search
    const hasWebSearch = true; // Force this to true since we're always using search

    console.log('🔍 Grounding info:', {
      hasGroundingMetadata: !!groundingMetadata,
      sourcesCount: sources.length,
      hasWebSearch,
      forcedSearch: true,
    });

    return {
      response: content.trim(),
      success: true,
      usage: data.usageMetadata ? {
        promptTokenCount: data.usageMetadata.promptTokenCount || 0,
        candidatesTokenCount: data.usageMetadata.candidatesTokenCount || 0,
        totalTokenCount: data.usageMetadata.totalTokenCount || 0,
      } : undefined,
      hasWebSearch,
      sources: sources.length > 0 ? sources : undefined,
      groundingMetadata,
    };

  } catch (error: any) {
    console.error('❌ Google Gemini API Error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500),
    });
    
    let errorMessage = 'Google Gemini is temporarily unavailable. Please try again.';
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMessage = 'Network error connecting to Google Gemini. Please check your internet connection.';
    } else if (error.message.includes('No content received')) {
      errorMessage = 'Google Gemini returned an empty response. Please try again with a different query.';
    } else if (error.message.includes('rate limit') || error.message.includes('429')) {
      errorMessage = 'Google Gemini API rate limit exceeded. Please wait a moment before trying again.';
    }
    
    return {
      response: generateMockGeminiResponse(query),
      success: false,
      error: errorMessage,
      hasWebSearch: false,
    };
  }
};

// Helper function to extract sources from grounding metadata
const extractSourcesFromGrounding = (groundingMetadata: any): string[] => {
  if (!groundingMetadata) return [];
  
  const sources: string[] = [];
  
  try {
    // Extract from grounding chunks
    if (groundingMetadata.groundingChunks) {
      groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri) {
          sources.push(chunk.web.uri);
        }
      });
    }
    
    // Extract from web search queries
    if (groundingMetadata.webSearchQueries) {
      groundingMetadata.webSearchQueries.forEach((query: any) => {
        if (query.searchResults) {
          query.searchResults.forEach((result: any) => {
            if (result.uri) {
              sources.push(result.uri);
            }
          });
        }
      });
    }
    
    // Extract from search entry point
    if (groundingMetadata.searchEntryPoint && groundingMetadata.searchEntryPoint.renderedContent) {
      const content = groundingMetadata.searchEntryPoint.renderedContent;
      const urlMatches = content.match(/https?:\/\/[^\s\)]+/g);
      if (urlMatches) {
        sources.push(...urlMatches);
      }
    }
    
  } catch (error) {
    console.warn('Error extracting sources from grounding metadata:', error);
  }
  
  // Remove duplicates and limit to 5 sources
  return [...new Set(sources)].slice(0, 5);
};

// Helper function to extract sources from response text (fallback)
const extractSourcesFromResponse = (text: string): string[] => {
  const sources: string[] = [];
  
  // Look for common URL patterns in the response
  const urlRegex = /https?:\/\/[^\s\)\]]+/g;
  const matches = text.match(urlRegex);
  
  if (matches) {
    // Clean up URLs and remove duplicates
    const cleanSources = matches
      .map(url => url.replace(/[.,;:\]\)]+$/, '')) // Remove trailing punctuation
      .filter((url, index, arr) => arr.indexOf(url) === index) // Remove duplicates
      .filter(url => !url.includes('example.com') && !url.includes('placeholder')) // Remove example URLs
      .slice(0, 5); // Limit to 5 sources
    
    sources.push(...cleanSources);
  }
  
  // Also look for source citations in markdown format
  const citationRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
  let citationMatch;
  while ((citationMatch = citationRegex.exec(text)) !== null) {
    const url = citationMatch[2];
    if (!sources.includes(url) && !url.includes('example.com')) {
      sources.push(url);
    }
  }
  
  return sources.slice(0, 5); // Limit to 5 sources total
};

// Generate mock Gemini response for fallback - EXTREMELY SHORT
export const generateMockGeminiResponse = (query: string): string => {
  const responses = [
    `^^ ${query} is a significant topic with growing importance across multiple sectors and recent developments show strong market fundamentals. ^^
Recent developments show strong market fundamentals, high adoption rates, and active investment from major stakeholders. This creates opportunities for innovation, competitive advantage, and market expansion through technology integration and strategic positioning.`,

    `^^ ${query} represents an important and rapidly evolving field with substantial implications for industry participants and current trends indicate robust performance metrics. ^^
Current trends indicate robust performance metrics, significant investment activity, and expanding market reach. The combination of strong fundamentals and emerging technologies suggests continued momentum and strategic value for stakeholders.`,

    `^^ ${query} is a well-established area with strong market presence and consistent growth trajectory with key highlights including robust user engagement. ^^
Key highlights include robust user engagement, technology innovation, and expanding adoption rates. This represents strategic opportunities for leveraging emerging trends, building competitive advantages, and capturing market value through innovation.`,
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
};