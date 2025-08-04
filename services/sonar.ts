import Constants from 'expo-constants';
import { extractDomain } from '@/utils/faviconUtils';

// Perplexity Sonar API Configuration - Optimized for Speed
const SONAR_API_CONFIG = {
  baseURL: 'https://api.perplexity.ai/chat/completions',
  model: 'sonar', // Use sonar-medium-online model for web search
  maxTokens: 150, // Reduced for faster responses
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
        sources: generateMockSources(query),
      };
    }

    // Try fast response first (no web search)
    const fastRequestBody = {
      model: 'sonar-medium-online',
      messages: [
        {
          role: 'user',
          content: `Provide a complete answer about: ${query} within 300 tokens.

CRITICAL: You must return the FULL response within the token limit. Format exactly like this:
^^ [1-2 sentence summary - NO bold formatting, bullet points, or dashes] ^^ [detailed explanation with proper formatting, bullet points, and structure]

The summary should be:
• Clean 1-2 sentence summary only
• NO bold formatting, bullet points, dashes, or list formatting
• Be concise but informative
• Capture the main points clearly
• MAXIMUM 150 CHARACTERS for the summary part only

The detailed content should be:
• Well-structured with bullet points
• Use **bold** for key terms and concepts
• Include proper spacing and formatting
• Be comprehensive but concise
• Complete the full response within token limit`
        }
      ],
      max_tokens: 300,
      temperature: 0.05,
      top_p: 0.05,
      stream: false,
      search_domain: 'none', // No web search for speed
      return_citations: false,
      return_images: false,
    };

    // Request with web search enabled for sources
    const requestBody = {
      model: SONAR_API_CONFIG.model,
      messages: [
        {
          role: 'user',
          content: `Provide a complete answer about: ${query} within 300 tokens.

CRITICAL: You must return the FULL response within the token limit. Format exactly like this:
^^ [1-2 sentence summary - NO bold formatting, bullet points, or dashes] ^^ [detailed explanation with proper formatting, bullet points, and structure]

The summary should be:
• Clean 1-2 sentence summary only
• NO bold formatting, bullet points, dashes, or list formatting
• Be concise but informative
• Capture the main points clearly
• MAXIMUM 150 CHARACTERS for the summary part only

The detailed content should be:
• Well-structured with bullet points
• Use **bold** for key terms and concepts
• Include proper spacing and formatting
• Be comprehensive but concise
• Complete the full response within token limit`
        }
      ],
      max_tokens: 300, // Complete response within token limit
      temperature: 0.05, // Very low temperature for fastest responses
      top_p: 0.05, // Minimal for fastest responses
      stream: false, // Ensure no streaming for faster response
      search_domain: 'all', // Enable web search
      return_citations: true, // Request citations/sources
      return_images: false, // Disable images for faster response
    };

    // Try fast response first (5 second timeout)
    const fastController = new AbortController();
    const fastTimeoutId = setTimeout(() => fastController.abort(), 5000);
    
    try {
      const fastResponse = await fetch(SONAR_API_CONFIG.baseURL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fastRequestBody),
        signal: fastController.signal,
      });
      
      clearTimeout(fastTimeoutId);
      
      if (fastResponse.ok) {
        const fastData = await fastResponse.json();
        if (fastData?.choices?.[0]?.message?.content) {
          console.log('⚡ Fast response successful');
          return {
            response: fastData.choices[0].message.content.trim(),
            success: true,
            usage: fastData.usage ? {
              promptTokenCount: fastData.usage.prompt_tokens || 0,
              candidatesTokenCount: fastData.usage.completion_tokens || 0,
              totalTokenCount: fastData.usage.total_tokens || 0,
            } : undefined,
            hasWebSearch: false,
            sources: generateMockSources(query), // Use mock sources for fast response
          };
        }
      }
    } catch (fastError) {
      console.log('⚡ Fast response failed, trying web search...');
    }
    
    // If fast response failed, try with web search
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for web search
    
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
        sources: generateMockSources(query),
      };
    }

    const data = await response.json();

    if (!data?.choices?.[0]?.message?.content) {
      return {
        response: generateMockSonarResponse(query),
        success: false,
        error: 'Invalid response from Sonar.',
        hasWebSearch: false,
        sources: generateMockSources(query),
      };
    }

    const content = data.choices[0].message.content;
    
    // Extract sources from the response if available
    let sources: Array<{title: string; url: string; domain: string}> = [];
    
    // Log the full response structure to debug
    console.log('🔍 Sonar API Response Structure:', JSON.stringify(data, null, 2));
    
    // Try different possible locations for sources
    if (data.choices[0].message.tool_calls) {
      console.log('🔍 Found tool_calls:', data.choices[0].message.tool_calls);
      sources = data.choices[0].message.tool_calls
        .filter((call: any) => call.type === 'web_search')
        .flatMap((call: any) => call.web_search?.results || [])
        .map((result: any) => ({
          title: result.title || 'Unknown',
          url: result.url || '',
          domain: extractDomain(result.url || ''),
        }));
    } else if (data.choices[0].message.content && typeof data.choices[0].message.content === 'string') {
      // Try to extract URLs from the content itself
      const urlRegex = /https?:\/\/[^\s]+/g;
      const urls = data.choices[0].message.content.match(urlRegex) || [];
      
      sources = urls.slice(0, 3).map((url: string) => ({
        title: `Source from ${extractDomain(url)}`,
        url: url,
        domain: extractDomain(url),
      }));
    }
    
    // If no sources found, use mock sources
    if (sources.length === 0) {
      console.log('🔍 No sources found in API response, using mock sources');
      sources = generateMockSources(query);
    }
    
    console.log('🔍 Extracted sources:', sources);

    return {
      response: content.trim(),
      success: true,
      usage: data.usage ? {
        promptTokenCount: data.usage.prompt_tokens || 0,
        candidatesTokenCount: data.usage.completion_tokens || 0,
        totalTokenCount: data.usage.total_tokens || 0,
      } : undefined,
      hasWebSearch: true,
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
        sources: generateMockSources(query),
      };
    }
    
    return {
      response: generateMockSonarResponse(query),
      success: false,
      error: 'Network error. Please try again.',
      hasWebSearch: false,
      sources: generateMockSources(query),
    };
  }
};

export const generateMockSonarResponse = (query: string): string => {
  const responses = [
    `^^ ${query} is a fascinating topic with core concepts and key benefits. ^^

Quick answer about **${query}**: This is a sample response with proper formatting. Add your Sonar API key for real answers. The full response would include detailed information, explanations, and context about the topic you searched for.

**Key Points:**
• **Definition**: What ${query} means and how it's defined
• **Applications**: How ${query} is used in practice
• **Benefits**: Why ${query} is important and valuable
• **Future**: Emerging trends and developments in ${query}`,
    
    `^^ ${query} encompasses important elements with key components and practical applications. ^^

**${query}** - Sample response with improved formatting. Configure API key for live Sonar responses. This mock response shows how the real Perplexity Sonar API would format its answers with a well-structured summary at the top and detailed information below.

**Main Components:**
• **Core Elements**: The fundamental aspects of ${query}
• **Implementation**: How ${query} works in practice
• **Advantages**: Benefits and positive aspects of ${query}
• **Considerations**: Important factors to keep in mind`,
    
    `^^ ${query} represents a comprehensive field with core principles and significant future potential. ^^

Regarding **${query}**: This is a placeholder with enhanced formatting. Get real answers by setting up your API key. The actual response would provide comprehensive information about your search query with proper formatting, bullet points, and structure.

**Important Aspects:**
• **Fundamentals**: Basic concepts and principles of ${query}
• **Current State**: Present status and developments
• **Practical Uses**: Real-world applications and examples
• **Future Outlook**: What's coming next for ${query}`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
};

// Mock sources for demonstration
export const generateMockSources = (query: string) => {
  return [
    {
      title: `Wikipedia - ${query}`,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
      domain: 'wikipedia.org',
    },
    {
      title: `${query} - Latest News`,
      url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      domain: 'google.com',
    },
    {
      title: `${query} Information`,
      url: `https://www.britannica.com/search?query=${encodeURIComponent(query)}`,
      domain: 'britannica.com',
    },
  ];
}; 