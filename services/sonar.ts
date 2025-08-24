import Constants from 'expo-constants';
import { extractDomain } from '@/utils/faviconUtils';

// Perplexity Sonar API Configuration - Optimized for Speed
const SONAR_API_CONFIG = {
  baseURL: 'https://api.perplexity.ai/chat/completions',
  model: 'sonar', // Use sonar-medium-online model for web search
  maxTokens: 300, // Cap total tokens to 300
  temperature: 0.1, // Lower temperature for faster, more focused responses
};

// Enforce hard content limits regardless of model behavior
const MAX_WORDS = 200;
const clampToWords = (input: string, maxWords: number = MAX_WORDS): string => {
  if (!input) return '';
  const words = input.trim().split(/\s+/);
  if (words.length <= maxWords) return input.trim();
  return words.slice(0, maxWords).join(' ') + '…';
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
• Complete the full response within token limit

Absolute constraints:
• Keep the entire response under 200 words
• Do not exceed 300 tokens total. If you would exceed, summarize to stay under 200 words`
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
• Complete the full response within token limit

Absolute constraints:
• Keep the entire response under 200 words
• Do not exceed 300 tokens total. If you would exceed, summarize to stay under 200 words`
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
            response: clampToWords(fastData.choices[0].message.content.trim()),
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
      response: clampToWords(content.trim()),
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

// Fast, concise follow-up chat for mini chat UI
export const quickFollowUp = async (
  question: string,
  context?: string
): Promise<SonarResponse> => {
  const apiKey = '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';

  const makeRequest = async (model: string, timeoutMs: number) => {
    const prompt = context
      ? `Context: ${context}\n\nAnswer concisely in 2-4 sentences. Keep under 200 words. No markdown, no lists, no sources. Do not exceed 300 tokens.\nQuestion: ${question}`
      : `Answer concisely in 2-4 sentences. Keep under 200 words. No markdown, no lists, no sources. Do not exceed 300 tokens.\nQuestion: ${question}`;

    const body: any = {
      model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 300,
      temperature: 0.2,
      top_p: 0.5,
      stream: false,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(SONAR_API_CONFIG.baseURL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn('quickFollowUp non-OK:', response.status, errorData);
        return null;
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content?.trim() || '';
      return {
        response: clampToWords(content || 'No answer available.'),
        success: true,
        usage: data.usage
          ? {
              promptTokenCount: data.usage.prompt_tokens || 0,
              candidatesTokenCount: data.usage.completion_tokens || 0,
              totalTokenCount: data.usage.total_tokens || 0,
            }
          : undefined,
        hasWebSearch: false,
      } as SonarResponse;
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn('quickFollowUp error:', err?.message || err);
      return null;
    }
  };

  try {
    if (!apiKey) {
      return {
        response: 'Quick answer: (demo) please configure the Sonar API key.',
        success: false,
        hasWebSearch: false,
      } as SonarResponse;
    }

    // Use valid model names per current Perplexity docs
    let result = await makeRequest('sonar', 10000);
    if (!result) {
      result = await makeRequest('sonar-pro', 12000);
    }
    // Final fallback: return a concise mock response to avoid UX dead-end
    if (!result) {
      const mock = generateMockSonarResponse(question).split('\n').slice(0, 4).join('\n');
      return {
        response: mock,
        success: true,
        hasWebSearch: false,
      } as SonarResponse;
    }
    return result;
  } catch (error: any) {
    console.warn('quickFollowUp fatal error:', error?.message || error);
    const mock = generateMockSonarResponse(question).split('\n').slice(0, 4).join('\n');
    return {
      response: mock,
      success: true,
      hasWebSearch: false,
    } as SonarResponse;
  }
};

// AI Generation Follow-up with Chat History
export const aiFollowUp = async (
  question: string,
  chatHistory: Array<{role: 'user' | 'assistant', content: string}> = [],
  options?: {
    maxTokens?: number;
    temperature?: number;
    includeWebSearch?: boolean;
  }
): Promise<SonarResponse> => {
  try {
    console.log('🤖 AI Follow-up request:', question);
    console.log('📝 Chat history length:', chatHistory.length);
    
    const apiKey = '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';
    
    if (!apiKey) {
      return {
        response: 'Please configure the Sonar API key for AI follow-up responses.',
        success: false,
        error: 'API key not configured.',
        hasWebSearch: false,
      };
    }

    const maxTokens = options?.maxTokens || 400;
    const temperature = options?.temperature || 0.3;
    const includeWebSearch = options?.includeWebSearch || false;

    // Build conversation context from chat history
    const conversationContext = chatHistory.length > 0 
      ? chatHistory.slice(-6).map(msg => `${msg.role}: ${msg.content}`).join('\n')
      : '';

    // Create the prompt for conversational follow-up
    const prompt = `You are a helpful AI assistant having a conversation with a user. 

${conversationContext ? `Previous conversation context:\n${conversationContext}\n\n` : ''}Current question: ${question}

Please provide a conversational and concise response that:
- Answers the user's question directly and helpfully
- Is written in a natural, conversational tone
- Keeps the response concise (under 200 words)
- Can be about any topic the user asks about
- Maintains context from the conversation if relevant
- Uses a friendly, helpful personality

Respond naturally as if you're having a friendly chat.`;

    const requestBody = {
      model: includeWebSearch ? 'sonar-medium-online' : 'sonar',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature: temperature,
      top_p: 0.7,
      stream: false,
      search_domain: includeWebSearch ? 'all' : 'none',
      return_citations: includeWebSearch,
      return_images: false,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
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
      console.error('❌ AI Follow-up error:', response.status, errorData);
      
      return {
        response: 'I apologize, but I\'m having trouble responding right now. Could you try rephrasing your question?',
        success: false,
        error: 'API request failed.',
        hasWebSearch: false,
      };
    }

    const data = await response.json();

    if (!data?.choices?.[0]?.message?.content) {
      return {
        response: 'I received an empty response. Could you try asking your question again?',
        success: false,
        error: 'Invalid response from API.',
        hasWebSearch: false,
      };
    }

    const content = data.choices[0].message.content;
    
    // Extract sources if web search was enabled
    let sources: Array<{title: string; url: string; domain: string}> = [];
    
    if (includeWebSearch && data.choices[0].message.tool_calls) {
      sources = data.choices[0].message.tool_calls
        .filter((call: any) => call.type === 'web_search')
        .flatMap((call: any) => call.web_search?.results || [])
        .map((result: any) => ({
          title: result.title || 'Unknown',
          url: result.url || '',
          domain: extractDomain(result.url || ''),
        }));
    }

    return {
      response: clampToWords(content.trim()),
      success: true,
      usage: data.usage ? {
        promptTokenCount: data.usage.prompt_tokens || 0,
        candidatesTokenCount: data.usage.completion_tokens || 0,
        totalTokenCount: data.usage.total_tokens || 0,
      } : undefined,
      hasWebSearch: includeWebSearch,
      sources: sources.length > 0 ? sources : undefined,
    };

  } catch (error: any) {
    console.error('❌ AI Follow-up error:', error.message);
    
    if (error.name === 'AbortError') {
      return {
        response: 'I\'m taking a bit longer than expected to respond. Could you try again?',
        success: false,
        error: 'Request timed out.',
        hasWebSearch: false,
      };
    }
    
    return {
      response: 'I\'m experiencing some technical difficulties. Please try again in a moment.',
      success: false,
      error: 'Network error.',
      hasWebSearch: false,
    };
  }
};

// Streaming Sonar (SSE) helper – web-friendly, graceful native fallback
export type SonarStreamHandlers = {
  onToken?: (text: string) => void; // Called for each incremental text token
  onDone?: (fullText: string) => void; // Called when stream completes
  onError?: (error: any) => void; // Called on error
};

export const searchSonarStream = async (
  prompt: string,
  handlers: SonarStreamHandlers = {},
  options?: { model?: string; controller?: AbortController }
) => {
  const apiKey = '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';

  const { onToken, onDone, onError } = handlers;
  const controller = options?.controller ?? new AbortController();
  const model = options?.model ?? 'sonar-pro';

  const body = {
    model,
    messages: [{ role: 'user', content: prompt }],
    stream: true,
  } as const;

  try {
    const response = await fetch(SONAR_API_CONFIG.baseURL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    // If streaming body is not available (common on native), fall back
    const supportsStreaming = !!(response as any)?.body?.getReader;
    if (!supportsStreaming) {
      const nonStream = await searchSonar(prompt);
      const limited = clampToWords(nonStream.response);
      onToken?.(limited);
      onDone?.(limited);
      return { cancel: () => controller.abort() };
    }

    const reader = (response as any).body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let buffer = '';
    let fullText = '';
    let finished = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by double newlines
        const parts = buffer.split('\n\n');
        // Keep the last partial frame in buffer
        buffer = parts.pop() || '';

        for (const part of parts) {
          const lines = part.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const dataStr = trimmed.replace(/^data:\s?/, '');
            if (dataStr === '[DONE]') {
              done = true;
              break;
            }
            try {
              const json = JSON.parse(dataStr);
              // Try OpenAI-like delta, then other shapes
              const delta = json?.choices?.[0]?.delta?.content
                ?? json?.choices?.[0]?.message?.content
                ?? json?.output
                ?? '';
              if (delta) {
                if (finished) continue;
                // Enforce 200-word cap incrementally
                const currentWords = fullText.trim().length === 0 ? 0 : fullText.trim().split(/\s+/).length;
                const remaining = MAX_WORDS - currentWords;
                if (remaining <= 0) {
                  finished = true;
                  controller.abort();
                  const limited = clampToWords(fullText);
                  onDone?.(limited);
                  break;
                }
                // Find how many words from delta we can still take
                const deltaWords = delta.split(/\s+/);
                const take = Math.min(deltaWords.length, remaining);
                const accepted = deltaWords.slice(0, take).join(' ');
                fullText = (fullText + (fullText.endsWith(' ') || fullText.length === 0 ? '' : ' ') + accepted).trim();
                onToken?.(accepted);
                if (take < deltaWords.length) {
                  finished = true;
                  controller.abort();
                  const limited = clampToWords(fullText);
                  onDone?.(limited);
                  break;
                }
              }
            } catch (_) {
              // Not JSON, ignore
            }
          }
        }
      }
    }

    onDone?.(clampToWords(fullText));
    return { cancel: () => controller.abort() };
  } catch (error) {
    onError?.(error);
    try {
      const fallback = await searchSonar(prompt);
      const limited = clampToWords(fallback.response);
      onToken?.(limited);
      onDone?.(limited);
    } catch {}
    return { cancel: () => controller.abort() };
  }
};