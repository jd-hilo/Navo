import { searchGemini, generateMockGeminiResponse } from './gemini';
import { SearchResultsService } from './database';
import { supabase } from './database';
import { useSubscription } from '../contexts/SubscriptionContext';

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

        // Create TikTok URL - make it more robust
        const videoUrl = author && videoId ? 
          `https://www.tiktok.com/@${author}/video/${videoId}` :
          `https://www.tiktok.com/@tiktok/video/${videoId || '7341995265751758081'}`;

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
  // Generate dynamic video IDs based on query and timestamp
  const timestamp = Date.now();
  const queryHash = query.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  
  const dynamicVideoIds = [
    `${timestamp}${queryHash}1`,
    `${timestamp}${queryHash}2`,
    `${timestamp}${queryHash}3`,
    `${timestamp}${queryHash}4`,
    `${timestamp}${queryHash}5`,
  ];
  
  const mockAuthors = [
    `${query.toLowerCase().replace(/\s+/g, '')}_creator`,
    `${query.toLowerCase().replace(/\s+/g, '')}_pro`,
    `${query.toLowerCase().replace(/\s+/g, '')}_viral`,
    `${query.toLowerCase().replace(/\s+/g, '')}_expert`,
    `${query.toLowerCase().replace(/\s+/g, '')}_trending`,
  ];
  
  const mockVideos = [
    {
      id: '1',
      title: `Amazing ${query} compilation that will blow your mind! 🤯`,
      thumbnail: 'https://images.pexels.com/photos/3944091/pexels-photo-3944091.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop',
      author: mockAuthors[0],
      views: '1.2M',
      url: `https://www.tiktok.com/@${mockAuthors[0]}/video/${dynamicVideoIds[0]}`,
    },
    {
      id: '2',
      title: `${query} tutorial - step by step guide ✨`,
      thumbnail: 'https://images.pexels.com/photos/3787327/pexels-photo-3787327.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop',
      author: mockAuthors[1],
      views: '856K',
      url: `https://www.tiktok.com/@${mockAuthors[1]}/video/${dynamicVideoIds[1]}`,
    },
    {
      id: '3',
      title: `Why ${query} is trending right now 🔥`,
      thumbnail: 'https://images.pexels.com/photos/3823495/pexels-photo-3823495.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop',
      author: mockAuthors[2],
      views: '2.1M',
      url: `https://www.tiktok.com/@${mockAuthors[2]}/video/${dynamicVideoIds[2]}`,
    },
    {
      id: '4',
      title: `${query} facts you didn't know 📚`,
      thumbnail: 'https://images.pexels.com/photos/3769979/pexels-photo-3769979.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop',
      author: mockAuthors[3],
      views: '445K',
      url: `https://www.tiktok.com/@${mockAuthors[3]}/video/${dynamicVideoIds[3]}`,
    },
    {
      id: '5',
      title: `Best ${query} moments of 2024 💫`,
      thumbnail: 'https://images.pexels.com/photos/3586966/pexels-photo-3586966.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop',
      author: mockAuthors[4],
      views: '1.8M',
      url: `https://www.tiktok.com/@${mockAuthors[4]}/video/${dynamicVideoIds[4]}`,
    },
  ];
  
  return mockVideos.slice(0, Math.floor(Math.random() * 3) + 3); // Return 3-5 videos
};

export const searchAllSources = async (query: string, isPremium: boolean = false): Promise<SearchResults> => {
  console.log(`🔍 Starting search for: "${query}"`);
  const startTime = Date.now();
  
  // Get current user ID for tracking search count
  const userId = await getCurrentUserId();
  
  // Add 1 second delay for non-premium users
  if (!isPremium) {
    console.log('⏳ Adding 1 second delay for non-premium user...');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Simulate API delay for better UX
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
  
  // Start all API calls in parallel
  const geminiStart = Date.now();
  const tiktokStart = Date.now();
  const redditStart = Date.now();

  const geminiPromise = searchGemini(query).then(result => {
    console.log(`⏱️ Gemini response returned in ${Date.now() - geminiStart}ms`);
    return result;
  }).catch(error => {
    console.error('Error calling Google Gemini API:', error);
    return {
      response: generateMockGeminiResponse(query),
      success: false,
      error: 'Unable to connect to Google Gemini. Showing sample response.',
      hasWebSearch: false,
    };
  });

  const tiktokPromise = searchTikTokAPI(query).then(result => {
    console.log(`⏱️ TikTok response returned in ${Date.now() - tiktokStart}ms`);
    return result;
  });

  const redditPromise = searchRedditRapidAPI(query).then(result => {
    console.log(`⏱️ Reddit response returned in ${Date.now() - redditStart}ms`);
    return result;
  });

  // Wait for all to finish
  const [geminiResults, tiktokResults, redditResults] = await Promise.all([
    geminiPromise,
    tiktokPromise,
    redditPromise,
  ]);
  
  const results = {
    gemini: geminiResults,
    tiktok: tiktokResults,
    reddit: redditResults,
  };
  
  const totalTime = Date.now() - startTime;
  const premiumStatus = isPremium ? 'premium' : 'non-premium';
  console.log(`✨ Search completed for "${query}" in ${totalTime}ms (${premiumStatus} user)`);
  
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
        comments: item.commentCount || 0,
        upvotes: item.score || 0,
        url: postUrl,
        subreddit: item.subreddit?.name || item.subreddit?.prefixedName || query,
        created: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '',
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

// Fetch Reddit comments for a post by postId
export const fetchRedditComments = async (postId: string, sort: string = 'confidence') => {
  const url = `${REDDIT_API_CONFIG.baseURL}/posts/comments?postId=${encodeURIComponent(postId)}&sort=${sort}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: REDDIT_API_CONFIG.headers,
  });
  if (!response.ok) {
    throw new Error(`Reddit comments API returned status ${response.status}`);
  }
  const data = await response.json();
  return data.data || [];
};

// Export database service for direct use
export { SearchResultsService };

// Function to get individual TikTok video details and extract video URL
export const getTikTokVideoDetails = async (tiktokUrl: string): Promise<{
  success: boolean;
  videoUrl?: string;
  videoData?: any;
  error?: string;
  fallbackUrl?: string;
}> => {
  try {
    console.log('🎬 Getting TikTok video details for:', tiktokUrl);
    
    // Extract video ID from URL - handle different TikTok URL formats
    let videoId: string = '';
    let username: string = '';
    
    // Handle different TikTok URL formats
    if (tiktokUrl.includes('/video/')) {
      const urlParts: string[] = tiktokUrl.split('/');
      const videoIndex = urlParts.findIndex(part => part === 'video');
      
      if (videoIndex !== -1 && videoIndex + 1 < urlParts.length) {
        videoId = urlParts[videoIndex + 1];
        // Get username from before the video part
        if (videoIndex > 0) {
          username = urlParts[videoIndex - 1]?.replace('@', '') || '';
        }
      }
    } else if (tiktokUrl.includes('vm.tiktok.com') || tiktokUrl.includes('vt.tiktok.com')) {
      // Handle shortened URLs - we'll need to follow the redirect
      console.log('⚠️ Shortened TikTok URL detected, following redirect...');
      try {
        const response = await fetch(tiktokUrl, { method: 'HEAD', redirect: 'follow' });
        const finalUrl = response.url;
        console.log('🔗 Redirected to:', finalUrl);
        return await getTikTokVideoDetails(finalUrl);
      } catch (redirectError) {
        console.error('❌ Error following redirect:', redirectError);
      }
    }
    
    // Clean up video ID (remove query parameters)
    if (videoId) {
      videoId = videoId.split('?')[0];
    }
    
    if (!videoId) {
      console.error('❌ Could not extract video ID from URL:', tiktokUrl);
      throw new Error('Invalid TikTok URL format - could not extract video ID');
    }
    
    console.log('📋 Extracted video ID:', videoId, 'Username:', username);
    
    // Try different API endpoints for video details
    const endpoints = [
      `/api/video/detail?video_id=${videoId}`,
      `/api/video/info?video_id=${videoId}`,
      `/api/video/by-id?video_id=${videoId}`,
    ];
    
    let lastError: any = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Trying endpoint: ${endpoint}`);
        
        const response: Response = await fetch(`${TIKTOK_API_CONFIG.baseURL}${endpoint}`, {
          method: 'GET',
          headers: TIKTOK_API_CONFIG.headers,
        });
        
        console.log('📦 TikTok API Response Status:', response.status);
        
        if (response.ok) {
          const data: any = await response.json();
          console.log('📦 TikTok API Response Data Keys:', data ? Object.keys(data) : []);
          
          if (data && (data.data || data.video || data.item)) {
            const videoData: any = data.data || data.video || data.item;
            
            // Try multiple paths to extract video URL
            const videoUrlPaths = [
              'video.play_addr.url_list.0',
              'video.download_addr.url_list.0',
              'video.bit_rate.0.play_addr.url_list.0',
              'video.bit_rate.0.download_addr.url_list.0',
              'play_addr.url_list.0',
              'download_addr.url_list.0',
              'video_url',
              'play_url',
              'download_url',
            ];
            
            for (const path of videoUrlPaths) {
              const extractedVideoUrl: string = safeGet(videoData, path);
              if (extractedVideoUrl) {
                console.log('✅ Successfully extracted video URL from path:', path);
                console.log('🎬 Video URL:', extractedVideoUrl);
                
                return {
                  success: true,
                  videoUrl: extractedVideoUrl,
                  videoData: videoData,
                };
              }
            }
            
            console.warn('⚠️ No video URL found in response data');
            console.log('🔍 Available data structure:', JSON.stringify(videoData, null, 2).substring(0, 1000));
          }
        } else {
          console.warn(`⚠️ Endpoint ${endpoint} returned status ${response.status}`);
          lastError = new Error(`API returned status ${response.status}`);
        }
      } catch (endpointError) {
        console.warn(`⚠️ Endpoint ${endpoint} failed:`, endpointError);
        lastError = endpointError;
      }
    }
    
    // If we get here, all endpoints failed
    throw lastError || new Error('All API endpoints failed');
    
  } catch (error: any) {
    console.error('❌ TikTok Video Details API Error:', error);
    
    let errorMessage = 'Failed to get video details';
    
    if (error.message.includes('429')) {
      errorMessage = 'API rate limit reached. Please wait a moment.';
    } else if (error.message.includes('403')) {
      errorMessage = 'API access denied. Please check API key.';
    } else if (error.message.includes('401')) {
      errorMessage = 'API authentication failed.';
    } else if (error.message.includes('404')) {
      errorMessage = 'Video not found or private.';
    } else if (error.message.includes('Invalid TikTok URL')) {
      errorMessage = 'Invalid TikTok URL format.';
    }
    
    return {
      success: false,
      error: errorMessage,
      fallbackUrl: tiktokUrl, // Return original URL as fallback
    };
  }
};