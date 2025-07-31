import { searchSonar } from './sonar';

interface ContentAnalysis {
  tiktok: {
    videos: any[];
    relevance: number;
    themes: string[];
  };
  reddit: {
    posts: any[];
    relevance: number;
    themes: string[];
    sentiment: 'positive' | 'negative' | 'neutral';
  };
  pinterest: {
    pins: any[];
    relevance: number;
    themes: string[];
  };
}

interface AIResponseData {
  mainResponse: string;
  tiktokSection?: {
    introduction: string;
    videos: any[];
  };
  redditSection?: {
    introduction: string;
    posts: any[];
    summary: string;
  };
  pinterestSection?: {
    introduction: string;
    pins: any[];
  };
  sources: {
    type: string;
    count: number;
    relevance: number;
  }[];
}

export class AIResponseGenerator {
  static async generateIntelligentResponse(
    query: string,
    searchResults: {
      gemini: any;
      tiktok: any;
      reddit: any;
      pinterest: any;
    }
  ): Promise<AIResponseData> {
    try {
      // Analyze content relevance and themes
      const analysis = this.analyzeContent(query, searchResults);
      
      // Generate enhanced AI response using Sonar
      const enhancedPrompt = this.createEnhancedPrompt(query, analysis);
      const aiResponse = await searchSonar(enhancedPrompt);
      
      // Log the FULL AI response for debugging
      console.log('📝 FULL AI RESPONSE:');
      console.log('='.repeat(50));
      console.log(aiResponse.response || 'No response received');
      console.log('='.repeat(50));
      
      // Log the prompt that was sent to AI
      console.log('📝 PROMPT SENT TO AI:');
      console.log('='.repeat(50));
      console.log(enhancedPrompt);
      console.log('='.repeat(50));
      
      // Structure the response with embedded content
      let mainResponse = aiResponse.response || searchResults.gemini?.response || '';
      const sources = [];
      const responseData: AIResponseData = {
        mainResponse: '',
        sources: []
      };

      // Check if the AI response contains placeholder tokens
      let hasTikTokPlaceholder = mainResponse.includes('{{INSERT_TIKTOK}}');
      let hasRedditPlaceholder = mainResponse.includes('{{INSERT_REDDIT}}');
      let hasPinterestPlaceholder = mainResponse.includes('{{INSERT_PINTEREST}}');

      console.log('🔍 Placeholder analysis:', {
        hasTikTokPlaceholder,
        hasRedditPlaceholder,
        hasPinterestPlaceholder,
        responseLength: mainResponse.length
      });

      // Add TikTok section if available, requested via placeholder, and high quality
      const contentQuality = this.analyzeContentQuality(query, analysis);
      
      console.log('🎯 Content Quality Assessment:', contentQuality);
      
      console.log('🔍 TikTok analysis:', {
        videosCount: analysis.tiktok.videos.length,
        relevance: analysis.tiktok.relevance,
        themes: analysis.tiktok.themes,
        placeholderRequested: hasTikTokPlaceholder,
        quality: contentQuality.tiktok
      });
      
      if (analysis.tiktok.videos.length > 0 && hasTikTokPlaceholder && contentQuality.tiktok !== 'low') {
        const tiktokIntro = this.generateTikTokIntroduction(query, analysis.tiktok);
        
        responseData.tiktokSection = {
          introduction: tiktokIntro,
          videos: analysis.tiktok.videos.slice(0, 3)
        };
        
        sources.push({
          type: 'TikTok',
          count: analysis.tiktok.videos.length,
          relevance: analysis.tiktok.relevance
        });
        
        console.log('✅ Added TikTok section with', analysis.tiktok.videos.length, 'videos (quality: ' + contentQuality.tiktok + ')');
      } else if (hasTikTokPlaceholder && contentQuality.tiktok === 'low') {
        console.log('❌ Skipped TikTok section due to low quality');
      }

      // Add Reddit section if available, requested via placeholder, and high quality
      console.log('🔍 Reddit analysis:', {
        postsCount: analysis.reddit.posts.length,
        relevance: analysis.reddit.relevance,
        themes: analysis.reddit.themes,
        sentiment: analysis.reddit.sentiment,
        placeholderRequested: hasRedditPlaceholder,
        quality: contentQuality.reddit
      });
      
      if (analysis.reddit.posts.length > 0 && hasRedditPlaceholder && contentQuality.reddit !== 'low') {
        const redditIntro = this.generateRedditIntroduction(query, analysis.reddit);
        
        responseData.redditSection = {
          introduction: redditIntro,
          posts: analysis.reddit.posts.slice(0, 2),
          summary: this.generateRedditSummary(analysis.reddit)
        };
        
        sources.push({
          type: 'Reddit',
          count: analysis.reddit.posts.length,
          relevance: analysis.reddit.relevance
        });
        
        console.log('✅ Added Reddit section with', analysis.reddit.posts.length, 'posts (quality: ' + contentQuality.reddit + ')');
      } else if (hasRedditPlaceholder && contentQuality.reddit === 'low') {
        console.log('❌ Skipped Reddit section due to low quality');
      }

      // Add Pinterest section if available, requested via placeholder, and high quality
      console.log('🔍 Pinterest analysis:', {
        pinsCount: analysis.pinterest.pins.length,
        relevance: analysis.pinterest.relevance,
        themes: analysis.pinterest.themes,
        placeholderRequested: hasPinterestPlaceholder,
        quality: contentQuality.pinterest
      });
      
      if (analysis.pinterest.pins.length > 0 && hasPinterestPlaceholder && contentQuality.pinterest !== 'low') {
        const pinterestIntro = this.generatePinterestIntroduction(query, analysis.pinterest);
        
        responseData.pinterestSection = {
          introduction: pinterestIntro,
          pins: analysis.pinterest.pins.slice(0, 4)
        };
        
        sources.push({
          type: 'Pinterest',
          count: analysis.pinterest.pins.length,
          relevance: analysis.pinterest.relevance
        });
        
        console.log('✅ Added Pinterest section with', analysis.pinterest.pins.length, 'pins (quality: ' + contentQuality.pinterest + ')');
      } else if (hasPinterestPlaceholder && contentQuality.pinterest === 'low') {
        console.log('❌ Skipped Pinterest section due to low quality');
      }

      // Fallback: If AI didn't use placeholders but high-quality content is available, append it
      let finalResponse = mainResponse;
      
      if (!hasTikTokPlaceholder && analysis.tiktok.videos.length > 0 && contentQuality.tiktok !== 'low') {
        console.log('🔄 Fallback: Adding TikTok section since AI didn\'t use placeholder (quality: ' + contentQuality.tiktok + ')');
        const tiktokIntro = this.generateTikTokIntroduction(query, analysis.tiktok);
        finalResponse += `\n\n**Visual Inspiration & Trends**\nCheck out these viral TikTok videos showing the best spots {{INSERT_TIKTOK}}`;
        
        responseData.tiktokSection = {
          introduction: tiktokIntro,
          videos: analysis.tiktok.videos.slice(0, 3)
        };
        
        if (!sources.find(s => s.type === 'TikTok')) {
          sources.push({
            type: 'TikTok',
            count: analysis.tiktok.videos.length,
            relevance: analysis.tiktok.relevance
          });
        }
      }
      
      if (!hasRedditPlaceholder && analysis.reddit.posts.length > 0 && contentQuality.reddit !== 'low') {
        console.log('🔄 Fallback: Adding Reddit section since AI didn\'t use placeholder (quality: ' + contentQuality.reddit + ')');
        const redditIntro = this.generateRedditIntroduction(query, analysis.reddit);
        finalResponse += `\n\n**Community Recommendations**\nReddit travelers share their top picks {{INSERT_REDDIT}}`;
        
        responseData.redditSection = {
          introduction: redditIntro,
          posts: analysis.reddit.posts.slice(0, 2),
          summary: this.generateRedditSummary(analysis.reddit)
        };
        
        if (!sources.find(s => s.type === 'Reddit')) {
          sources.push({
            type: 'Reddit',
            count: analysis.reddit.posts.length,
            relevance: analysis.reddit.relevance
          });
        }
      }
      
      if (!hasPinterestPlaceholder && analysis.pinterest.pins.length > 0 && contentQuality.pinterest !== 'low') {
        console.log('🔄 Fallback: Adding Pinterest section since AI didn\'t use placeholder (quality: ' + contentQuality.pinterest + ')');
        const pinterestIntro = this.generatePinterestIntroduction(query, analysis.pinterest);
        finalResponse += `\n\n**Travel Aesthetics & Ideas**\nFor stunning travel photography and inspiration {{INSERT_PINTEREST}}`;
        
        responseData.pinterestSection = {
          introduction: pinterestIntro,
          pins: analysis.pinterest.pins.slice(0, 4)
        };
        
        if (!sources.find(s => s.type === 'Pinterest')) {
          sources.push({
            type: 'Pinterest',
            count: analysis.pinterest.pins.length,
            relevance: analysis.pinterest.relevance
          });
        }
      }

      // Clean up the response to fix factual answer format
      finalResponse = this.cleanupFactualAnswerFormat(finalResponse);
      
      // Set the final response (with fallback placeholders if needed)
      responseData.mainResponse = finalResponse;
      responseData.sources = sources;
      
      // Log the FINAL response that gets sent to the UI
      console.log('🎯 FINAL RESPONSE SENT TO UI:');
      console.log('='.repeat(50));
      console.log(finalResponse);
      console.log('='.repeat(50));

      console.log('🎯 Final AI Response Data:', {
        hasTikTok: !!responseData.tiktokSection,
        hasReddit: !!responseData.redditSection,
        hasPinterest: !!responseData.pinterestSection,
        sourcesCount: sources.length,
        responseLength: finalResponse.length,
        placeholders: {
          tiktok: hasTikTokPlaceholder || finalResponse.includes('{{INSERT_TIKTOK}}'),
          reddit: hasRedditPlaceholder || finalResponse.includes('{{INSERT_REDDIT}}'),
          pinterest: hasPinterestPlaceholder || finalResponse.includes('{{INSERT_PINTEREST}}')
        },
        fallbackUsed: {
          tiktok: !hasTikTokPlaceholder && analysis.tiktok.videos.length > 0,
          reddit: !hasRedditPlaceholder && analysis.reddit.posts.length > 0,
          pinterest: !hasPinterestPlaceholder && analysis.pinterest.pins.length > 0
        }
      });

      return responseData;
    } catch (error) {
      console.error('Error generating AI response:', error);
      // Fallback to basic response
      return {
        mainResponse: searchResults.gemini?.response || 'I found some information about your query, but I encountered an issue generating a comprehensive response.',
        sources: []
      };
    }
  }

  private static analyzeContent(query: string, searchResults: any): ContentAnalysis {
    const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 2);
    
    // Analyze TikTok content
    const tiktokVideos = searchResults.tiktok?.videos || [];
    const tiktokThemes = this.extractThemes(tiktokVideos.map((v: any) => v.title));
    const tiktokRelevance = this.calculateRelevance(queryWords, tiktokVideos.map((v: any) => v.title));

    // Analyze Reddit content
    const redditPosts = searchResults.reddit?.posts || [];
    const redditThemes = this.extractThemes(redditPosts.map((p: any) => p.title + ' ' + (p.preview || '')));
    const redditRelevance = this.calculateRelevance(queryWords, redditPosts.map((p: any) => p.title + ' ' + (p.preview || '')));
    const redditSentiment = this.analyzeSentiment(redditPosts);

    // Analyze Pinterest content
    const pinterestPins = searchResults.pinterest?.pins || [];
    const pinterestThemes = this.extractThemes(pinterestPins.map((p: any) => p.title + ' ' + (p.description || '')));
    const pinterestRelevance = this.calculateRelevance(queryWords, pinterestPins.map((p: any) => p.title + ' ' + (p.description || '')));

    return {
      tiktok: {
        videos: tiktokVideos,
        relevance: tiktokRelevance,
        themes: tiktokThemes
      },
      reddit: {
        posts: redditPosts,
        relevance: redditRelevance,
        themes: redditThemes,
        sentiment: redditSentiment
      },
      pinterest: {
        pins: pinterestPins,
        relevance: pinterestRelevance,
        themes: pinterestThemes
      }
    };
  }

  private static extractThemes(texts: string[]): string[] {
    const allText = texts.join(' ').toLowerCase();
    const words = allText.split(/\s+/);
    const wordCount: { [key: string]: number } = {};
    
    words.forEach(word => {
      if (word.length > 3 && !this.isCommonWord(word)) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });

    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  private static isCommonWord(word: string): boolean {
    const commonWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'];
    return commonWords.includes(word);
  }

  private static calculateRelevance(queryWords: string[], texts: string[]): number {
    if (texts.length === 0) return 0;
    
    let totalMatches = 0;
    let totalTexts = texts.length;
    
    texts.forEach(text => {
      const textLower = text.toLowerCase();
      const matches = queryWords.filter(word => textLower.includes(word)).length;
      totalMatches += matches;
    });
    
    // More lenient relevance calculation - if any content exists, give it some relevance
    const baseRelevance = 0.3; // Base relevance for any content
    const calculatedRelevance = Math.min(1, totalMatches / (queryWords.length * totalTexts));
    
    return Math.max(baseRelevance, calculatedRelevance);
  }

  private static analyzeSentiment(posts: any[]): 'positive' | 'negative' | 'neutral' {
    if (posts.length === 0) return 'neutral';
    
    const positiveWords = ['good', 'great', 'awesome', 'amazing', 'love', 'best', 'excellent', 'perfect', 'wonderful', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'awful', 'worst', 'hate', 'disappointing', 'frustrating', 'annoying', 'useless', 'waste'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    posts.forEach(post => {
      const text = (post.title + ' ' + (post.preview || '')).toLowerCase();
      positiveWords.forEach(word => {
        if (text.includes(word)) positiveCount++;
      });
      negativeWords.forEach(word => {
        if (text.includes(word)) negativeCount++;
      });
    });
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private static createEnhancedPrompt(query: string, analysis: ContentAnalysis): string {
    // Determine content relevance and quality
    const contentQuality = this.analyzeContentQuality(query, analysis);
    
    let prompt = `You're generating an intelligent search response for a modern search app. The user's query is: '${query}'.\n\n`;
    
    prompt += `**Available content sources:**\n`;
    if (analysis.tiktok.videos.length > 0) {
      prompt += `- TikTok: ${analysis.tiktok.videos.length} videos (quality: ${contentQuality.tiktok})\n`;
    }
    if (analysis.reddit.posts.length > 0) {
      prompt += `- Reddit: ${analysis.reddit.posts.length} posts (quality: ${contentQuality.reddit})\n`;
    }
    if (analysis.pinterest.pins.length > 0) {
      prompt += `- Pinterest: ${analysis.pinterest.pins.length} pins (quality: ${contentQuality.pinterest})\n`;
    }
    
    prompt += `\n**Determine the query intent and respond accordingly:**\n\n`;
    
    prompt += `**If the query is FACTUAL (one clear answer):**\n`;
    prompt += `- Start with: ^^[clear answer]^^\n`;
    prompt += `- Then add collapsed media sections\n`;
    prompt += `- Example: "^^Paris is the capital of France^^"\n\n`;
    
    prompt += `**RESPONSE INSTRUCTIONS - PERPLEXITY STYLE:**\n\n`;
    prompt += `Write a comprehensive response with proper markdown formatting:\n\n`;
    prompt += `**For factual questions:** Start with ^^[clear answer]^^\n`;
    prompt += `**For complex topics:** Use **bold headers**, bullet points, and clear sections\n`;
    prompt += `**Content matching:**\n`;
    prompt += `- TikTok: {{INSERT_TIKTOK}} for visual content, DIY, trends, viral info\n`;
    prompt += `- Reddit: {{INSERT_REDDIT}} for community opinions, discussions, recommendations\n`;
    prompt += `- Pinterest: {{INSERT_PINTEREST}} for visual inspiration, aesthetics, ideas\n\n`;
    prompt += `**Example structure:**\n`;
    prompt += `**Top Trending Destinations for 2025**\n\n`;
    prompt += `Here are the most exciting places to visit this year.\n\n`;
    prompt += `**Asia's Rising Stars**\n`;
    prompt += `• Osaka, Japan - Food paradise with amazing nightlife\n`;
    prompt += `• Bali, Indonesia - Cultural hotspot with stunning beaches\n\n`;
    prompt += `**Visual Inspiration & Trends**\n`;
    prompt += `Check out these viral TikTok videos showing the best spots {{INSERT_TIKTOK}}\n\n`;
    prompt += `**Community Recommendations**\n`;
    prompt += `Reddit travelers share their top picks {{INSERT_REDDIT}}\n\n`;
    prompt += `**Travel Aesthetics & Ideas**\n`;
    prompt += `For stunning travel photography and inspiration {{INSERT_PINTEREST}}\n\n`;
    prompt += `**PERPLEXITY STYLE RULES:**\n`;
    prompt += `- Use **bold headers** for main sections\n`;
    prompt += `- Include bullet points (•) for lists\n`;
    prompt += `- Write in a conversational, engaging tone\n`;
    prompt += `- Structure with clear sections and natural flow\n`;
    prompt += `- Match content types to their natural purpose:\n`;
    prompt += `  • TikTok for visual trends, DIY, viral content\n`;
    prompt += `  • Reddit for community opinions and discussions\n`;
    prompt += `  • Pinterest for visual inspiration and aesthetics\n`;
    prompt += `- Use ^^ for simple factual answers only\n`;
    prompt += `- Quality over quantity - only include highly relevant media\n`;
    prompt += `- Make it scannable and easy to read\n\n`;
    prompt += `**User Query:** ${query}\n\n`;
    prompt += `**Generate a concise, engaging response that naturally weaves in relevant media.**\n\n`;
    prompt += `**IMPORTANT:** Weave the media into your explanation naturally. Don't just list placeholders at the end. Use phrases like:\n`;
    prompt += `- "Check out these TikTok videos showing..."\n`;
    prompt += `- "Reddit users recommend..."\n`;
    prompt += `- "For visual inspiration, see..."\n`;
    prompt += `Then place the placeholder right after that phrase.`;
    
    return prompt;
  }

  private static generateTikTokIntroduction(query: string, tiktokAnalysis: any): string {
    return `Relevant TikTok Videos`;
  }

  private static generateRedditIntroduction(query: string, redditAnalysis: any): string {
    return `Relevant Reddit Posts`;
  }

  private static generateRedditSummary(redditAnalysis: any): string {
    const totalPosts = redditAnalysis.posts.length;
    const totalUpvotes = redditAnalysis.posts.reduce((sum: number, post: any) => sum + (post.upvotes || 0), 0);
    const avgUpvotes = Math.round(totalUpvotes / totalPosts);
    
    return `Based on ${totalPosts} Reddit posts with an average of ${avgUpvotes} upvotes, the community shows ${redditAnalysis.sentiment} sentiment toward this topic.`;
  }

  private static generatePinterestIntroduction(query: string, pinterestAnalysis: any): string {
    return `Relevant Pinterest Ideas`;
  }

  private static cleanupFactualAnswerFormat(response: string): string {
    // Fix common AI mistakes in factual answer format
    let cleaned = response;
    
    // Remove "The answer is:" prefix and clean up ** formatting
    cleaned = cleaned.replace(/\^\^\*\*The answer is:\s*(.*?)\*\*\^\^/g, '^^$1^^');
    
    // Also catch variations without the ^^ wrapper
    cleaned = cleaned.replace(/\*\*The answer is:\s*(.*?)\*\*/g, '^^$1^^');
    
    // Clean up any remaining ** inside ^^
    cleaned = cleaned.replace(/\^\^(.*?)\*\*(.*?)\*\*(.*?)\^\^/g, '^^$1$2$3^^');
    
    return cleaned;
  }

  private static analyzeContentQuality(query: string, analysis: ContentAnalysis): {
    tiktok: 'high' | 'medium' | 'low';
    reddit: 'high' | 'medium' | 'low';
    pinterest: 'high' | 'medium' | 'low';
  } {
    const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 2);
    
    // Analyze TikTok quality - MUCH STRICTER THRESHOLDS
    let tiktokQuality: 'high' | 'medium' | 'low' = 'low';
    if (analysis.tiktok.videos.length > 0) {
      const avgViews = analysis.tiktok.videos.reduce((sum: number, video: any) => {
        const views = parseInt(video.views?.replace(/[^\d]/g, '') || '0');
        return sum + views;
      }, 0) / analysis.tiktok.videos.length;
      
      // Only show TikTok if it's highly relevant and popular
      if (analysis.tiktok.relevance > 0.8 && avgViews > 50000) {
        tiktokQuality = 'high';
      } else if (analysis.tiktok.relevance > 0.7 && avgViews > 20000) {
        tiktokQuality = 'medium';
      }
    }
    
    // Analyze Reddit quality - MUCH STRICTER THRESHOLDS
    let redditQuality: 'high' | 'medium' | 'low' = 'low';
    if (analysis.reddit.posts.length > 0) {
      const avgUpvotes = analysis.reddit.posts.reduce((sum: number, post: any) => {
        return sum + (post.upvotes || 0);
      }, 0) / analysis.reddit.posts.length;
      
      // Only show Reddit if it's highly relevant and well-received
      if (analysis.reddit.relevance > 0.8 && avgUpvotes > 500) {
        redditQuality = 'high';
      } else if (analysis.reddit.relevance > 0.7 && avgUpvotes > 200) {
        redditQuality = 'medium';
      }
    }
    
    // Analyze Pinterest quality - MUCH STRICTER THRESHOLDS
    let pinterestQuality: 'high' | 'medium' | 'low' = 'low';
    if (analysis.pinterest.pins.length > 0) {
      const avgLikes = analysis.pinterest.pins.reduce((sum: number, pin: any) => {
        return sum + (pin.likes || 0);
      }, 0) / analysis.pinterest.pins.length;
      
      // Only show Pinterest if it's highly relevant and popular
      if (analysis.pinterest.relevance > 0.8 && avgLikes > 500) {
        pinterestQuality = 'high';
      } else if (analysis.pinterest.relevance > 0.7 && avgLikes > 200) {
        pinterestQuality = 'medium';
      }
    }
    
    return {
      tiktok: tiktokQuality,
      reddit: redditQuality,
      pinterest: pinterestQuality
    };
  }
} 