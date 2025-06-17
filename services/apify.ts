// Updated Apify service to use server-side API route with improved error handling
interface ApifyRedditResponse {
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
}

// Main function to search Reddit using server-side API route
export const searchRedditApify = async (query: string): Promise<ApifyRedditResponse> => {
  try {
    console.log('🔍 Making server-side Reddit API request for:', query);
    
    // Call our server-side API route instead of directly calling Apify
    const response = await fetch('/api/reddit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(60000), // Increased to 60 second timeout
    });

    console.log('📡 Server response status:', response.status);

    if (!response.ok) {
      console.error('❌ Server-side Reddit API failed:', response.status);
      
      // Try to get error details
      let errorText = '';
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorText = errorData.error || errorData.message || `Server error: ${response.status}`;
        } else {
          errorText = await response.text();
          console.log('❌ Non-JSON response:', errorText.substring(0, 200));
        }
      } catch (parseError) {
        console.error('❌ Error parsing server response:', parseError);
        errorText = `Server error: ${response.status}`;
      }
      
      throw new Error(`Server-side Reddit API failed: ${errorText}`);
    }

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('❌ Server returned non-JSON response');
      const textResponse = await response.text();
      console.log('❌ Response text:', textResponse.substring(0, 500));
      throw new Error('Server returned invalid response format');
    }

    const data = await response.json();
    console.log('✅ Server-side Reddit API response received:', {
      success: data.success,
      postsCount: data.posts?.length || 0,
      hasError: !!data.error,
    });

    // Validate response structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response structure from server');
    }

    // Ensure posts array exists
    if (!Array.isArray(data.posts)) {
      console.warn('⚠️ Posts is not an array, converting...');
      data.posts = [];
    }

    // Validate each post structure
    data.posts = data.posts.filter((post: any) => {
      return post && 
             typeof post === 'object' &&
             typeof post.id === 'string' &&
             typeof post.title === 'string' &&
             typeof post.subreddit === 'string';
    });

    return {
      posts: data.posts,
      success: data.success || false,
      error: data.error,
    };

  } catch (error: any) {
    console.error('❌ Reddit API Error:', error);
    
    let errorMessage = 'Reddit data temporarily unavailable. Showing sample posts.';
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMessage = 'Network error connecting to Reddit. Please check your connection. Showing sample posts.';
    } else if (error.message.includes('500')) {
      errorMessage = 'Reddit service error. Please try again later. Showing sample posts.';
    } else if (error.message.includes('timeout') || error.name === 'TimeoutError') {
      errorMessage = 'Reddit search timed out. Please try again. Showing sample posts.';
    } else if (error.name === 'AbortError') {
      errorMessage = 'Reddit search was cancelled. Showing sample posts.';
    } else if (error.message.includes('invalid response format')) {
      errorMessage = 'Reddit API returned invalid data. Showing sample posts.';
    } else if (error.message.includes('Server-side Reddit API failed')) {
      errorMessage = 'Reddit service is temporarily unavailable. Showing sample posts.';
    }
    
    // Return fallback data with error indication
    return {
      posts: generateMockRedditPosts(query),
      success: false,
      error: errorMessage,
    };
  }
};

// Generate mock Reddit posts for fallback
const generateMockRedditPosts = (query: string) => {
  const mockPosts = [
    {
      id: '1',
      title: `What are your thoughts on ${query}? Detailed discussion inside`,
      subreddit: 'AskReddit',
      author: 'curious_redditor',
      upvotes: 2847,
      awards: 3,
      comments: 156,
      preview: `I've been thinking about ${query} lately and wanted to get the community's perspective. There are so many different angles to consider...`,
      url: 'https://reddit.com/r/AskReddit/comments/abc123',
      created: '2h ago',
    },
    {
      id: '2',
      title: `[Serious] ${query} - A comprehensive analysis`,
      subreddit: 'todayilearned',
      author: 'knowledge_seeker',
      upvotes: 1203,
      awards: 1,
      comments: 89,
      preview: `TIL that ${query} has a fascinating history that most people don't know about. Here are the key facts...`,
      url: 'https://reddit.com/r/todayilearned/comments/def456',
      created: '4h ago',
    },
    {
      id: '3',
      title: `${query} megathread - All discussions here`,
      subreddit: 'discussion',
      author: 'moderator_01',
      upvotes: 892,
      awards: 0,
      comments: 234,
      preview: `Welcome to our weekly ${query} discussion thread. Please keep all related conversations in this post...`,
      url: 'https://reddit.com/r/discussion/comments/ghi789',
      created: '6h ago',
    },
    {
      id: '4',
      title: `My experience with ${query} - Story time!`,
      subreddit: 'stories',
      author: 'storyteller_99',
      upvotes: 1567,
      awards: 5,
      comments: 78,
      preview: `So this happened to me last week, and I thought you might find it interesting. It all started when I decided to try ${query}...`,
      url: 'https://reddit.com/r/stories/comments/jkl012',
      created: '8h ago',
    },
    {
      id: '5',
      title: `Pro tips for ${query} that actually work`,
      subreddit: 'LifeProTips',
      author: 'helpful_human',
      upvotes: 3421,
      awards: 7,
      comments: 187,
      preview: `LPT: After years of experience with ${query}, here are the most effective strategies I've discovered...`,
      url: 'https://reddit.com/r/LifeProTips/comments/mno345',
      created: '12h ago',
    },
  ];
  
  return mockPosts.slice(0, 5);
};

// Export for use in main API
export { ApifyRedditResponse };