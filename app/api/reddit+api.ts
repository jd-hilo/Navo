export async function POST(request: Request) {
  let query = '';
  
  try {
    console.log('🔍 Reddit API route called');
    
    const requestBody = await request.json();
    query = requestBody.query;
    
    if (!query) {
      return Response.json({ 
        error: 'Query parameter is required',
        posts: [],
        success: false 
      }, { status: 400 });
    }

    console.log('🔍 Server-side Reddit API request for:', query);

    // Check if Apify token is available - check multiple possible env var names
    const apiToken = process.env.EXPO_PUBLIC_APIFY_API_TOKEN || 
                     process.env.APIFY_API_TOKEN ||
                     process.env.EXPO_PUBLIC_APIFY_TOKEN;
    
    console.log('🔑 API Token check:', {
      hasToken: !!apiToken,
      tokenLength: apiToken?.length || 0,
      tokenStart: apiToken?.substring(0, 10) || 'none',
    });
    
    if (!apiToken || apiToken === 'your_apify_api_token_here' || apiToken.length < 10) {
      console.warn('⚠️ Apify API token not found, not configured, or invalid');
      return Response.json({
        posts: generateMockRedditPosts(query),
        success: false,
        error: 'To get live Reddit posts, add your Apify API token to the .env file. Currently showing sample posts.',
      });
    }

    // Use Apify Reddit Scraper Lite Actor
    const APIFY_BASE = 'https://api.apify.com/v2';
    const ACTOR_ID = 'trudax~reddit-scraper-lite';
    const input: any = {
      startUrls: [],
      maxItems: 5,
      searchPosts: true,
      searchComments: false,
      searchCommunities: false,
      searchUsers: false,
      sort: 'relevance',
      includeNSFW: false,
      debugMode: false,
    };
    // If query is a URL, use as startUrl, else use as keyword
    if (query.startsWith('http')) {
      input.startUrls = [{ url: query }];
    } else {
      input.startUrls = [];
      input.query = query;
    }

    // Start the actor
    const runResponse = await fetch(`${APIFY_BASE}/acts/${ACTOR_ID}/runs?token=${apiToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      return Response.json({
        posts: generateMockRedditPosts(query),
        success: false,
        error: `Failed to start Apify actor: ${runResponse.status} ${errorText}`,
      });
    }
    const runData = await runResponse.json();
    const runId = runData.data.id;

    // Poll for completion
    let status = 'RUNNING';
    let attempts = 0;
    while (status === 'RUNNING' && attempts < 30) {
      await new Promise(res => setTimeout(res, 2000));
      const statusRes = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${apiToken}`);
      const statusData = await statusRes.json();
      status = statusData.data.status;
      if (status === 'SUCCEEDED' || status === 'FINISHED') break;
      if (status === 'FAILED' || status === 'ABORTED') {
        return Response.json({
          posts: generateMockRedditPosts(query),
          success: false,
          error: 'Apify run failed',
        });
      }
      attempts++;
    }

    // Get results
    const resultsRes = await fetch(`${APIFY_BASE}/actor-runs/${runId}/dataset/items?token=${apiToken}&format=json&clean=true`);
    const results = await resultsRes.json();
    if (!results || results.length === 0) {
      return Response.json({
        posts: generateMockRedditPosts(query),
        success: false,
        error: `No Reddit posts found for "${query}". Try a different search term. Showing sample posts.`,
      });
    }

    // Return only the first 5 posts
    return Response.json({
      posts: results.slice(0, 5),
      success: true,
      error: null,
    });

  } catch (error: any) {
    console.error('❌ Reddit API Error:', error);
    
    let errorMessage = 'Reddit data temporarily unavailable. Showing sample posts.';
    
    if (error.message.includes('401') || error.message.includes('403')) {
      errorMessage = 'Invalid Apify API token. Please check your token in the .env file. Showing sample posts.';
    } else if (error.message.includes('404')) {
      errorMessage = 'Apify actor not found. Please verify the actor configuration. Showing sample posts.';
    } else if (error.message.includes('429')) {
      errorMessage = 'Apify API rate limit exceeded. Please wait before searching again. Showing sample posts.';
    } else if (error.message.includes('timeout') || error.name === 'TimeoutError') {
      errorMessage = 'Reddit search timed out. Please try again. Showing sample posts.';
    } else if (error.name === 'AbortError') {
      errorMessage = 'Reddit search was cancelled. Showing sample posts.';
    }
    
    return Response.json({
      posts: generateMockRedditPosts(query || 'default'),
      success: false,
      error: errorMessage,
    });
  }
}

// Handle GET requests for testing
export async function GET(request: Request) {
  const apiToken = process.env.EXPO_PUBLIC_APIFY_API_TOKEN || 
                   process.env.APIFY_API_TOKEN ||
                   process.env.EXPO_PUBLIC_APIFY_TOKEN;
  
  return Response.json({
    message: 'Reddit API endpoint is working',
    method: 'POST',
    usage: 'Send POST request with { "query": "your search term" }',
    tokenConfigured: !!apiToken && apiToken !== 'your_apify_api_token_here' && apiToken.length > 10,
    tokenLength: apiToken?.length || 0,
    actorId: 'trudax~reddit-scraper',
    testUrl: '/api/reddit',
  });
}

// Helper functions
function formatTimeAgo(timestamp: number | string): string {
  const now = Date.now();
  const time = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp * 1000;
  const diffInSeconds = Math.floor((now - time) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

function cleanText(text: string, maxLength: number = 150): string {
  if (!text) return '';
  
  // Remove HTML tags and decode HTML entities
  const cleaned = text
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/&/g, '&')
    .replace(/"/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove markdown bold
    .replace(/\*([^*]+)\*/g, '$1') // Remove markdown italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links
    .replace(/#{1,6}\s+/g, '') // Remove markdown headers
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
  
  return cleaned.length > maxLength ? cleaned.substring(0, maxLength) + '...' : cleaned;
}

function generateMockRedditPosts(query: string) {
  return [
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
}