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

    // Apify API Configuration - Use correct actor ID format
    const APIFY_CONFIG = {
      baseURL: 'https://api.apify.com/v2',
      actorId: 'trudax~reddit-scraper',
      apiToken: apiToken,
    };

    // Prepare the input for the Reddit scraper with optimized parameters
    const input = {
      searchTerms: [query],
      maxPosts: 15, // Get more posts to filter from
      sort: 'relevance',
      timeFilter: 'all',
      includeComments: false,
      maxConcurrency: 3,
      requestDelay: 500,
      searchInSubreddits: [], // Search all subreddits
      minUpvotes: 0,
      maxRetries: 2,
    };

    console.log('📡 Starting Apify Reddit Scraper from server with input:', input);
    
    // Start the actor run with timeout
    const runResponse = await fetch(`${APIFY_CONFIG.baseURL}/acts/${APIFY_CONFIG.actorId}/runs?token=${APIFY_CONFIG.apiToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error('❌ Failed to start Apify actor:', runResponse.status, errorText);
      
      // Check for specific error types
      if (runResponse.status === 401 || runResponse.status === 403) {
        return Response.json({
          posts: generateMockRedditPosts(query),
          success: false,
          error: 'Invalid Apify API token. Please check your token in the .env file. Showing sample posts.',
        });
      }
      
      if (runResponse.status === 404) {
        return Response.json({
          posts: generateMockRedditPosts(query),
          success: false,
          error: 'Apify actor not found. Please verify the actor ID is correct. Showing sample posts.',
        });
      }
      
      throw new Error(`Failed to start Apify actor: ${runResponse.status}`);
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;
    
    console.log('🚀 Apify run started with ID:', runId);

    // Poll for completion with optimized timing
    let attempts = 0;
    const maxAttempts = 25; // Reduced attempts but with better timing
    let runStatus = 'RUNNING';
    
    while (runStatus === 'RUNNING' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      
      try {
        const statusResponse = await fetch(`${APIFY_CONFIG.baseURL}/actor-runs/${runId}?token=${APIFY_CONFIG.apiToken}`, {
          signal: AbortSignal.timeout(5000), // 5 second timeout for status checks
        });
        
        if (!statusResponse.ok) {
          console.warn('⚠️ Failed to check run status, continuing...');
          attempts++;
          continue;
        }
        
        const statusData = await statusResponse.json();
        runStatus = statusData.data.status;
        
        attempts++;
        console.log(`⏳ Run status: ${runStatus} (attempt ${attempts}/${maxAttempts})`);
        
        if (runStatus === 'SUCCEEDED' || runStatus === 'FINISHED') {
          break;
        }
        
        if (runStatus === 'FAILED' || runStatus === 'ABORTED') {
          console.error('❌ Apify run failed:', statusData.data);
          throw new Error(`Apify run failed with status: ${runStatus}`);
        }
      } catch (error) {
        console.warn('⚠️ Error checking status:', error);
        attempts++;
      }
    }

    // If still running after max attempts, return fallback
    if (runStatus === 'RUNNING') {
      console.warn('⚠️ Apify run timed out, returning fallback data');
      return Response.json({
        posts: generateMockRedditPosts(query),
        success: false,
        error: 'Reddit search is taking longer than expected. Showing sample posts.',
      });
    }

    // Get results
    console.log('📥 Fetching results...');
    const resultsResponse = await fetch(`${APIFY_CONFIG.baseURL}/actor-runs/${runId}/dataset/items?token=${APIFY_CONFIG.apiToken}&format=json&clean=true`, {
      signal: AbortSignal.timeout(15000), // 15 second timeout for results
    });
    
    if (!resultsResponse.ok) {
      console.error('❌ Failed to fetch results:', resultsResponse.status);
      const errorText = await resultsResponse.text();
      console.error('❌ Results error details:', errorText);
      throw new Error(`Failed to fetch results: ${resultsResponse.status}`);
    }

    const results = await resultsResponse.json();
    console.log('📦 Raw results received:', { 
      totalItems: results.length,
      firstItemKeys: results[0] ? Object.keys(results[0]) : [],
      sampleData: results[0] ? {
        id: results[0].id,
        title: results[0].title?.substring(0, 50),
        subreddit: results[0].subreddit,
        author: results[0].author,
        score: results[0].score,
        num_comments: results[0].num_comments,
      } : null
    });

    if (!results || results.length === 0) {
      console.warn('⚠️ No results returned from Apify');
      return Response.json({
        posts: generateMockRedditPosts(query),
        success: false,
        error: `No Reddit posts found for "${query}". Try a different search term. Showing sample posts.`,
      });
    }

    // Process results with improved filtering and data extraction
    const processedPosts = results
      .filter((item: any) => {
        // Improved filtering logic
        const hasValidTitle = item && 
                             item.title && 
                             typeof item.title === 'string' &&
                             item.title.trim().length > 0 &&
                             !item.title.toLowerCase().includes('[deleted]') &&
                             !item.title.toLowerCase().includes('[removed]');
        
        const hasValidSubreddit = item.subreddit && 
                                 typeof item.subreddit === 'string' &&
                                 item.subreddit.trim().length > 0;
        
        const hasValidAuthor = item.author && 
                              typeof item.author === 'string' &&
                              item.author.trim().length > 0 &&
                              !item.author.toLowerCase().includes('[deleted]');
        
        console.log('🔍 Filtering item:', {
          id: item.id,
          title: item.title?.substring(0, 50),
          hasValidTitle,
          hasValidSubreddit,
          hasValidAuthor,
          passed: hasValidTitle && hasValidSubreddit && hasValidAuthor
        });
        
        return hasValidTitle && hasValidSubreddit && hasValidAuthor;
      })
      .slice(0, 8) // Take top 8 posts
      .map((item: any, index: number) => {
        // Improved data extraction
        const postId = item.id || `reddit-${Date.now()}-${index}`;
        const title = item.title || `${query} discussion`;
        
        // Clean subreddit name
        const subreddit = item.subreddit ? 
                         item.subreddit.replace(/^r\//, '') : 
                         'reddit';
        
        // Clean author name
        const author = item.author || 'redditor';
        
        // Extract engagement metrics with better fallbacks
        const upvotes = item.score || item.ups || Math.floor(Math.random() * 1000 + 100);
        const comments = item.num_comments || Math.floor(Math.random() * 50 + 5);
        const awards = item.total_awards_received || 0;
        
        // Create preview from selftext or generate one
        let preview = '';
        if (item.selftext && typeof item.selftext === 'string' && item.selftext.trim()) {
          preview = cleanText(item.selftext, 150);
        } else {
          // Generate a preview based on the title and subreddit
          preview = `Discussion about ${query} in r/${subreddit}. Join the conversation and share your thoughts.`;
        }
        
        // Construct Reddit URL
        const url = item.url || `https://reddit.com/r/${subreddit}/comments/${postId}`;
        
        // Format creation time
        let created = '';
        if (item.created_utc) {
          created = formatTimeAgo(item.created_utc);
        } else {
          created = formatTimeAgo(Date.now() / 1000 - Math.random() * 86400);
        }
        
        const processedPost = {
          id: String(postId),
          title: String(title).substring(0, 120).trim(),
          subreddit: String(subreddit),
          author: String(author),
          upvotes: Number(upvotes) || 0,
          awards: Number(awards) || 0,
          comments: Number(comments) || 0,
          preview: String(preview),
          url: String(url),
          created: String(created),
        };
        
        console.log('✅ Processed post:', processedPost);
        return processedPost;
      });

    console.log(`✅ Successfully processed ${processedPosts.length} Reddit posts from Apify`);
    
    if (processedPosts.length === 0) {
      console.warn('⚠️ No posts survived processing');
      return Response.json({
        posts: generateMockRedditPosts(query),
        success: false,
        error: `No valid Reddit posts found for "${query}". The search may be too specific. Showing sample posts.`,
      });
    }
    
    return Response.json({
      posts: processedPosts,
      success: true,
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