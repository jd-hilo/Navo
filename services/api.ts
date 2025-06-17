import { searchGemini, generateMockGeminiResponse } from './gemini';
import { SearchResultsService } from './database';
import { supabase } from './database';

// Mock API responses for demonstration
// In a real app, these would be actual API calls

interface SearchResults {
  gemini: {
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
  };
  tiktok: {
    videos: Array<{
      id: string;
      title: string;
      thumbnail: string;
      author: string;
      views: string;
      url: string;
    }>;
    success: boolean;
    error?: string;
  };
  reddit: {
    posts: Array<{
      id: string;
      title: string;
      subreddit: string;
      author: string;
      upvotes: number;
      awards: number;
      comments: number;
      preview: string;
      url: string;
      created: string;
    }>;
    success: boolean;
    error?: string;
  };
  cached?: boolean;
  cacheAge?: number;
}

// TikTok API Configuration
const TIKTOK_API_CONFIG = {
  baseURL: 'https://tiktok-api23.p.rapidapi.com',
  headers: {
    'x-rapidapi-key': '19ffbf4d65mshc2e303da6ae4289p1a9576jsn8520dc154989',
    'x-rapidapi-host': 'tiktok-api23.p.rapidapi.com',
  },
};

// Reddit API Configuration (RapidAPI)
const REDDIT_API_CONFIG = {
  baseURL: 'https://reddit-com.p.rapidapi.com',
  headers: {
    'x-rapidapi-key': '19ffbf4d65mshc2e303da6ae4289p1a9576jsn8520dc154989',
    'x-rapidapi-host': 'reddit-com.p.rapidapi.com',
  },
};

// Helper function to format view counts
const formatViews = (count: number | string): string => {
  const num = typeof count === 'string' ? parseInt(count) || 0 : count;
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Helper function to safely get nested object properties
const safeGet = (obj: any, path: string, defaultValue: any = null) => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : defaultValue;
  }, obj);
};

// Get current user ID
const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Real TikTok API function with comprehensive response handling
const searchTikTokAPI = async (query: string) => {
  try {
    console.log('🔍 Making TikTok API request for:', query);
    
    const response = await fetch(`${TIKTOK_API_CONFIG.baseURL}/api/search/general?keyword=${encodeURIComponent(query)}&cursor=0&search_id=0`, {
      method: 'GET',
      headers: TIKTOK_API_CONFIG.headers,
    });

    console.log('📦 TikTok API Response Status:', response.status);

    if (!response.ok) {
      throw new Error(`TikTok API returned status ${response.status}`);
    }

    const data = await response.json();
    console.log('📦 TikTok API Response Data Structure:', {
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : [],
      dataType: typeof data,
    });

    if (!data) {
      throw new Error('Empty response from TikTok API');
    }

    // Check if response has the expected structure based on your sample
    if (data.data && Array.isArray(data.data)) {
      const videoData = data.data;
      console.log(`✅ Found ${videoData.length} videos in response.data.data`);
      
      const videos = videoData.slice(0, 6).map((videoWrapper: any, index: number) => {
        // Extract the actual video data from the wrapper
        const video = videoWrapper.item || videoWrapper;
        
        if (!video) {
          console.warn(`⚠️ No video data found in item ${index}`);
          return null;
        }

        // Extract video ID
        const videoId = video.id || 
                       safeGet(video, 'common.doc_id_str') ||
                       videoWrapper.common?.doc_id_str ||
                       `tiktok-${Date.now()}-${index}`;

        // Extract title/description
        const title = video.desc || 
                     video.title || 
                     video.description || 
                     video.content || 
                     `${query} TikTok Video ${index + 1}`;

        // Extract thumbnail from video object
        const thumbnail = safeGet(video, 'video.cover') ||
                         safeGet(video, 'video.dynamic_cover') ||
                         safeGet(video, 'video.origin_cover') ||
                         safeGet(video, 'video.thumbnail') ||
                         'https://images.pexels.com/photos/3944091/pexels-photo-3944091.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop';

        // Extract author information
        const author = safeGet(video, 'author.unique_id') ||
                      safeGet(video, 'author.nickname') ||
                      safeGet(video, 'author.username') ||
                      'tiktokuser';

        // Extract play count/views
        const playCount = safeGet(video, 'stats.play_count') ||
                         safeGet(video, 'stats.view_count') ||
                         safeGet(video, 'statistics.play_count') ||
                         Math.floor(Math.random() * 500000 + 100000);

        // Create TikTok URL
        const videoUrl = `https://tiktok.com/@${author}/video/${videoId}`;

        const processedVideo = {
          id: String(videoId),
          title: String(title).substring(0, 100).trim(),
          thumbnail: String(thumbnail),
          author: String(author).replace('@', ''),
          views: formatViews(playCount),
          url: videoUrl,
        };

        console.log(`🎬 Processed video ${index + 1}:`, processedVideo);
        return processedVideo;
      }).filter(Boolean); // Remove any null entries

      if (videos.length > 0) {
        console.log(`✅ Successfully processed ${videos.length} TikTok videos`);
        return {
          videos,
          success: true,
        };
      }
    }

    // If we get here, the API returned data but not in expected format
    console.warn('⚠️ TikTok API returned unexpected format');
    console.warn('⚠️ Response structure:', JSON.stringify(data, null, 2).substring(0, 1000));
    
    return {
      videos: generateTikTokVideos(query),
      success: false,
      error: 'TikTok API returned unexpected format. Showing sample results.',
    };

  } catch (error: any) {
    console.error('❌ TikTok API Error:', error);
    
    let errorMessage = 'TikTok API temporarily unavailable. Showing sample results.';
    
    if (error.message.includes('429')) {
      errorMessage = 'TikTok API rate limit reached. Please wait a moment. Showing sample results.';
    } else if (error.message.includes('403')) {
      errorMessage = 'TikTok API access denied. Please check API key. Showing sample results.';
    } else if (error.message.includes('401')) {
      errorMessage = 'TikTok API authentication failed. Showing sample results.';
    } else if (error.message.includes('500')) {
      errorMessage = 'TikTok API server error. Please try again later. Showing sample results.';
    } else if (error.message.includes('404')) {
      errorMessage = 'TikTok API endpoint not found. Showing sample results.';
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMessage = 'Network error connecting to TikTok API. Please check your connection. Showing sample results.';
    }
    
    // Return fallback data with error indication
    return {
      videos: generateTikTokVideos(query),
      success: false,
      error: errorMessage,
    };
  }
};

// Mock data generators
const generateTikTokVideos = (query: string) => {
  const mockVideos = [
    {
      id: '1',
      title: `Amazing ${query} compilation that will blow your mind! 🤯`,
      thumbnail: 'https://images.pexels.com/photos/3944091/pexels-photo-3944091.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop',
      author: 'tiktokuser1',
      views: '1.2M',
      url: 'https://tiktok.com/@tiktokuser1/video/123456789',
    },
    {
      id: '2',
      title: `${query} tutorial - step by step guide ✨`,
      thumbnail: 'https://images.pexels.com/photos/3787327/pexels-photo-3787327.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop',
      author: 'creator_pro',
      views: '856K',
      url: 'https://tiktok.com/@creator_pro/video/123456790',
    },
    {
      id: '3',
      title: `Why ${query} is trending right now 🔥`,
      thumbnail: 'https://images.pexels.com/photos/3823495/pexels-photo-3823495.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop',
      author: 'viral_content',
      views: '2.1M',
      url: 'https://tiktok.com/@viral_content/video/123456791',
    },
    {
      id: '4',
      title: `${query} facts you didn't know 📚`,
      thumbnail: 'https://images.pexels.com/photos/3769979/pexels-photo-3769979.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop',
      author: 'factchecker',
      views: '445K',
      url: 'https://tiktok.com/@factchecker/video/123456792',
    },
    {
      id: '5',
      title: `Best ${query} moments of 2024 💫`,
      thumbnail: 'https://images.pexels.com/photos/3586966/pexels-photo-3586966.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop',
      author: 'highlights2024',
      views: '1.8M',
      url: 'https://tiktok.com/@highlights2024/video/123456793',
    },
  ];
  
  return mockVideos.slice(0, Math.floor(Math.random() * 3) + 3); // Return 3-5 videos
};

export const searchAllSources = async (query: string): Promise<SearchResults> => {
  console.log(`🔍 Starting search for: "${query}"`);
  
  // Get current user ID for caching and search count
  const userId = await getCurrentUserId();
  
  // Check cache first
  if (userId) {
    console.log('👤 User authenticated, checking cache...');
    const cachedResults = await SearchResultsService.getCachedResults(query, userId);
    
    if (cachedResults) {
      console.log(`✅ Found cached results for "${query}"`);
      // Still increment search count for cached results
      await SearchResultsService.incrementSearchCount(userId);
      return {
        ...cachedResults,
        cached: true,
      };
    }
    
    console.log(`❌ No cached results found for "${query}", fetching fresh data...`);
  } else {
    console.log('👤 User not authenticated, skipping cache check');
  }
  
  // Simulate API delay for better UX
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
  
  // Get real Gemini response
  let geminiResults;
  try {
    geminiResults = await searchGemini(query);
  } catch (error) {
    console.error('Error calling Google Gemini API:', error);
    geminiResults = {
      response: generateMockGeminiResponse(query),
      success: false,
      error: 'Unable to connect to Google Gemini. Showing sample response.',
      hasWebSearch: false,
    };
  }
  
  // Get TikTok results (real API call)
  const tiktokResults = await searchTikTokAPI(query);
  
  const results = {
    gemini: geminiResults,
    tiktok: tiktokResults,
    reddit: await searchRedditRapidAPI(query),
  };
  
  // Save to cache and increment search count if user is authenticated
  if (userId) {
    console.log('💾 Saving results to cache and incrementing search count...');
    
    // Save results to cache
    const saved = await SearchResultsService.saveResults(query, results, userId);
    if (saved) {
      console.log(`✅ Results cached for "${query}"`);
    } else {
      console.log(`❌ Failed to cache results for "${query}"`);
    }
    
    // Increment search count
    const countIncremented = await SearchResultsService.incrementSearchCount(userId);
    if (countIncremented) {
      console.log(`✅ Search count incremented for user: ${userId}`);
    } else {
      console.log(`❌ Failed to increment search count for user: ${userId}`);
    }
  }
  
  return {
    ...results,
    cached: false,
  };
};

// Individual API functions for future use
export const searchGeminiAPI = async (query: string) => {
  return await searchGemini(query);
};

export const searchTikTok = async (query: string) => {
  return await searchTikTokAPI(query);
};

export const searchReddit = async (query: string) => {
  return await searchRedditRapidAPI(query);
};

// Fetch top 5 Reddit posts for a subreddit or query using RapidAPI
export const searchRedditRapidAPI = async (query: string) => {
  try {
    // Use the correct endpoint for searching Reddit posts
    const url = `${REDDIT_API_CONFIG.baseURL}/posts/search-posts?query=${encodeURIComponent(query)}&sort=relevance&time=all`;
    const response = await fetch(url, {
      method: 'GET',
      headers: REDDIT_API_CONFIG.headers,
    });
    if (!response.ok) {
      throw new Error(`Reddit RapidAPI returned status ${response.status}`);
    }
    const data = await response.json();
    const posts = (data.data || []).slice(0, 5).map((item: any, idx: number) => {
      // Media extraction
      let mediaUrl = null;
      if (item.media?.still?.source?.url) {
        mediaUrl = item.media.still.source.url;
      } else if (item.url && item.url.match(/\.(jpg|jpeg|png|gif|mp4|webm)$/)) {
        mediaUrl = item.url;
      } else if (item.thumbnail?.url) {
        mediaUrl = item.thumbnail.url;
      }

      // Text extraction
      let text = '';
      if (item.content?.preview) text = item.content.preview;
      else if (item.content?.markdown) text = item.content.markdown;
      else if (item.content?.html) text = item.content.html;
      else text = '';

      // URL
      let postUrl = item.permalink
        ? (item.permalink.startsWith('http') ? item.permalink : `https://reddit.com${item.permalink}`)
        : item.url || '';

      return {
        id: item.id || `reddit-${Date.now()}-${idx}`,
        title: item.postTitle || '',
        text,
        author: item.authorInfo?.name || '',
        comments: item.commentCount || 0,
        upvotes: item.score || 0,
        url: postUrl,
        subreddit: item.subreddit?.name || item.subreddit?.prefixedName || query,
        created: item.createdAt || '',
        media: mediaUrl,
        thumbnail: item.thumbnail?.url || null,
      };
    });
    return {
      posts,
      success: true,
    };
  } catch (error: any) {
    console.error('❌ Reddit RapidAPI Error:', error);
    return {
      posts: [],
      success: false,
      error: error.message || 'Failed to fetch Reddit posts from RapidAPI',
    };
  }
};

// Export database service for direct use
export { SearchResultsService };