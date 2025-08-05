import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Image,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, ChevronDown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

// Import content modules
import TikTokSection from './TikTokSection';
import RedditSection from './RedditSection';
import PinterestSection from './PinterestSection';
import GeminiSection from './GeminiSection';

// Import layout engine
import { 
  analyzeSearchLayout, 
  LayoutConfig, 
  ModuleLayout, 
  ModuleType,
  PriorityLevel,
  DisplayMode,
  shouldShowModule,
  getDisplayOrder
} from '@/utils/layoutEngine';

interface DynamicLayoutEngineProps {
  searchResults: {
    gemini: any;
    tiktok: any;
    reddit: any;
    pinterest: any;
  };
  query: string;
  onRetry?: () => void;
  isLoading?: boolean;
  showAIOptimizedLayout?: boolean;
}

interface ModuleState {
  isExpanded: boolean;
  isVisible: boolean;
}

export default function DynamicLayoutEngine({ 
  searchResults, 
  query, 
  onRetry, 
  isLoading,
  showAIOptimizedLayout = true
}: DynamicLayoutEngineProps) {
  const { theme } = useTheme();
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig | null>(null);
  const [moduleStates, setModuleStates] = useState<Record<ModuleType, ModuleState>>({
    tiktok: { isExpanded: true, isVisible: true },
    reddit: { isExpanded: true, isVisible: true },
    pinterest: { isExpanded: true, isVisible: true },
  });


  // Analyze layout when query changes
  useEffect(() => {
    if (query.trim().length > 0) {
      const config = analyzeSearchLayout(query);
      setLayoutConfig(config);
      
        // Initialize module states - all expanded and visible
  const newModuleStates: Record<ModuleType, ModuleState> = {
    tiktok: { 
      isExpanded: true,
      isVisible: true
    },
    reddit: { 
      isExpanded: true,
      isVisible: true
    },
    pinterest: { 
      isExpanded: true,
      isVisible: true
    },
  };
      setModuleStates(newModuleStates);
    }
  }, [query]);

  // Get ordered modules for display
  const orderedModules = useMemo(() => {
    if (!layoutConfig) return [];
    return getDisplayOrder(layoutConfig.layout);
  }, [layoutConfig]);

  // Get module data mapping
  const moduleDataMap = {
    tiktok: searchResults.tiktok,
    reddit: searchResults.reddit,
    pinterest: searchResults.pinterest,
  };

  // Get module component mapping
  const getModuleComponent = (moduleType: ModuleType, isCollapsed: boolean = false) => {
    const data = moduleDataMap[moduleType];
    const hasData = data?.success && 
      ((moduleType === 'tiktok' && data.videos?.length > 0) ||
       (moduleType === 'reddit' && data.posts?.length > 0) ||
       (moduleType === 'pinterest' && data.pins?.length > 0));

    if (!hasData) return null;

    if (isCollapsed) {
      return getCollapsedPreview(moduleType, data);
    }

    switch (moduleType) {
      case 'tiktok':
        return <TikTokSection data={data} query={query} onRetry={onRetry} />;
      case 'reddit':
        return <RedditSection data={data} query={query} onRetry={onRetry} />;
      case 'pinterest':
        return <PinterestSection data={data} query={query} onRetry={onRetry} />;
      default:
        return null;
    }
  };

  // Get collapsed preview for modules
  const getCollapsedPreview = (moduleType: ModuleType, data: any) => {
    switch (moduleType) {
      case 'tiktok':
        const videos = data.videos || [];
        const videoCount = videos.length;
        return (
          <View style={styles.collapsedPreview}>
            <Text style={styles.previewTitle}>TikTok Videos ({videoCount})</Text>
            <View style={styles.tiktokThumbnails}>
              {videos.slice(0, 3).map((video: any, index: number) => (
                <View key={index} style={styles.tiktokThumbnail}>
                  <Image 
                    source={{ uri: video.thumbnail }} 
                    style={styles.thumbnailImage}
                    resizeMode="cover"
                  />
                  <View style={styles.thumbnailOverlay}>
                    <Text style={styles.thumbnailText} numberOfLines={1}>
                      {video.title || `Video ${index + 1}`}
                    </Text>
                  </View>
                </View>
              ))}
              {videoCount > 3 && (
                <View style={styles.moreVideosIndicator}>
                  <Text style={styles.moreVideosText}>+{videoCount - 3}</Text>
                </View>
              )}
            </View>
            <Text style={styles.previewSubtext}>
              {videos[0]?.author} • {videos[0]?.views} • {videoCount} videos
            </Text>
          </View>
        );
      
      case 'reddit':
        const posts = data.posts || [];
        const postCount = posts.length;
        return (
          <View style={styles.collapsedPreview}>
            <Text style={styles.previewTitle}>Reddit Posts ({postCount})</Text>
            {posts.slice(0, 2).map((post: any, index: number) => (
              <View key={index} style={styles.previewItem}>
                <Text style={styles.previewText} numberOfLines={1}>
                  {post.title}
                </Text>
                <Text style={styles.previewSubtext}>
                  r/{post.subreddit} • {post.upvotes} upvotes • {post.comments} comments
                </Text>
              </View>
            ))}
            {postCount > 2 && (
              <Text style={styles.previewSubtext}>+{postCount - 2} more posts</Text>
            )}
          </View>
        );
      
      case 'pinterest':
        const pins = data.pins || [];
        const pinCount = pins.length;
        return (
          <View style={styles.collapsedPreview}>
            <Text style={styles.previewTitle}>Pinterest Pins ({pinCount})</Text>
            <View style={styles.pinterestThumbnails}>
              {pins.slice(0, 4).map((pin: any, index: number) => (
                <View key={index} style={styles.pinterestThumbnail}>
                  <Image 
                    source={{ uri: pin.image_url }} 
                    style={styles.thumbnailImage}
                    resizeMode="cover"
                  />
                </View>
              ))}
              {pinCount > 4 && (
                <View style={styles.morePinsIndicator}>
                  <Text style={styles.morePinsText}>+{pinCount - 4}</Text>
                </View>
              )}
            </View>
            <Text style={styles.previewSubtext}>
              {pins[0]?.likes} likes • {pins[0]?.saves} saves • {pinCount} pins
            </Text>
          </View>
        );
      
      default:
        return null;
    }
  };

  // Toggle module expansion
  const toggleModuleExpansion = (moduleType: ModuleType) => {
    // Add haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setModuleStates(prev => ({
      ...prev,
      [moduleType]: {
        ...prev[moduleType],
        isExpanded: !prev[moduleType].isExpanded
      }
    }));
  };

  // Toggle module visibility
  const toggleModuleVisibility = (moduleType: ModuleType) => {
    setModuleStates(prev => ({
      ...prev,
      [moduleType]: {
        ...prev[moduleType],
        isVisible: !prev[moduleType].isVisible
      }
    }));
  };

  // Get priority color
  const getPriorityColor = (priority: PriorityLevel) => {
    switch (priority) {
      case 'high': return '#10B981'; // green
      case 'medium': return '#F59E0B'; // amber
      case 'low': return '#6B7280'; // gray
      case 'none': return '#EF4444'; // red
      default: return '#6B7280';
    }
  };

  // Get display mode label
  const getDisplayModeLabel = (display: DisplayMode) => {
    switch (display) {
      case 'full': return 'Full';
      case 'expandable': return 'Expandable';
      case 'collapsed': return 'Collapsed';
      case 'hidden': return 'Hidden';
      default: return 'Unknown';
    }
  };

  // Get explanatory message for each module
  const getExplanatoryMessage = (moduleType: ModuleType, query: string, data?: any) => {
    // Generate contextual descriptions based on the query, module type, and available data
    const generateDescription = (type: ModuleType, searchQuery: string, moduleData?: any) => {
      const queryLower = searchQuery.toLowerCase();
      
      // Get content count for more specific messaging
      const getContentCount = () => {
        if (!moduleData) return '';
        switch (type) {
          case 'tiktok':
            // Use relevant count if available, otherwise use total count
            if (tiktokAnalysis && tiktokAnalysis.relevantCount > 0) {
              return ` (${tiktokAnalysis.relevantCount} relevant videos)`;
            } else {
              const videoCount = moduleData.videos?.length || 0;
              return videoCount > 0 ? ` (${videoCount} videos)` : '';
            }
          case 'reddit':
            // Use relevant count if available, otherwise use total count
            if (redditAnalysis && redditAnalysis.relevantCount > 0) {
              return ` (${redditAnalysis.relevantCount} relevant posts)`;
            } else {
              const postCount = moduleData.posts?.length || 0;
              return postCount > 0 ? ` (${postCount} posts)` : '';
            }
          case 'pinterest':
            const pinCount = moduleData.pins?.length || 0;
            return pinCount > 0 ? ` (${pinCount} pins)` : '';
          default:
            return '';
        }
      };
      
      // Analyze TikTok content for specific insights
      const analyzeTikTokContent = () => {
        if (!moduleData?.videos || moduleData.videos.length === 0) return '';
        
        // Filter videos for relevance to search query
        const searchTerms = searchQuery.toLowerCase().split(' ').filter(term => term.length > 2);
        const relevantVideos = moduleData.videos.filter((video: any) => {
          const title = (video.title || '').toLowerCase();
          const description = (video.description || '').toLowerCase();
          const author = (video.author || '').toLowerCase();
          
          // Check if any search term appears in title, description, or author
          return searchTerms.some(term => 
            title.includes(term) || 
            description.includes(term) || 
            author.includes(term)
          );
        });
        
        // Use relevant videos if found, otherwise use all videos
        const videos = relevantVideos.length > 0 ? relevantVideos : moduleData.videos;
        const titles = videos.map((v: any) => v.title || '').join(' ').toLowerCase();
        const descriptions = videos.map((v: any) => v.description || '').join(' ').toLowerCase();
        const allText = titles + ' ' + descriptions;
        
        // Analyze content themes
        const themes = [];
        if (allText.includes('tutorial') || allText.includes('how to') || allText.includes('step')) {
          themes.push('tutorials');
        }
        if (allText.includes('recipe') || allText.includes('cooking') || allText.includes('food')) {
          themes.push('recipes');
        }
        if (allText.includes('fashion') || allText.includes('outfit') || allText.includes('style')) {
          themes.push('fashion');
        }
        if (allText.includes('travel') || allText.includes('vacation') || allText.includes('trip')) {
          themes.push('travel');
        }
        if (allText.includes('fitness') || allText.includes('workout') || allText.includes('exercise')) {
          themes.push('fitness');
        }
        if (allText.includes('beauty') || allText.includes('makeup') || allText.includes('skincare')) {
          themes.push('beauty');
        }
        if (allText.includes('trend') || allText.includes('viral') || allText.includes('popular')) {
          themes.push('trending');
        }
        if (allText.includes('diy') || allText.includes('craft') || allText.includes('project')) {
          themes.push('DIY');
        }
        
        // Get top creators
        const creators = videos.slice(0, 3).map((v: any) => v.author).filter(Boolean);
        const creatorText = creators.length > 0 ? ` from ${creators.join(', ')}` : '';
        
        // Get view counts
        const totalViews = videos.reduce((sum: number, v: any) => sum + (parseInt(v.views) || 0), 0);
        const avgViews = Math.round(totalViews / videos.length);
        const viewText = avgViews > 1000000 ? `${(avgViews / 1000000).toFixed(1)}M` : 
                        avgViews > 1000 ? `${(avgViews / 1000).toFixed(1)}K` : avgViews.toString();
        
        return { 
          themes, 
          creatorText, 
          viewText, 
          avgViews,
          relevantCount: relevantVideos.length,
          totalCount: moduleData.videos.length 
        };
      };
      
      const contentCount = getContentCount();
      const tiktokAnalysis = type === 'tiktok' ? analyzeTikTokContent() : null;
      
      // Analyze Reddit content for specific insights
      const analyzeRedditContent = () => {
        if (!moduleData?.posts || moduleData.posts.length === 0) return null;
        
        // Filter posts for relevance to search query
        const searchTerms = searchQuery.toLowerCase().split(' ').filter(term => term.length > 2);
        const relevantPosts = moduleData.posts.filter((post: any) => {
          const title = (post.title || '').toLowerCase();
          const content = (post.content || '').toLowerCase();
          const subreddit = (post.subreddit || '').toLowerCase();
          
          // Check if any search term appears in title, content, or subreddit
          return searchTerms.some(term => 
            title.includes(term) || 
            content.includes(term) || 
            subreddit.includes(term)
          );
        });
        
        // Use relevant posts if found, otherwise use all posts
        const posts = relevantPosts.length > 0 ? relevantPosts : moduleData.posts;
        const titles = posts.map((p: any) => p.title || '').join(' ').toLowerCase();
        const subreddits = [...new Set(posts.map((p: any) => p.subreddit))].slice(0, 3);
        const totalUpvotes = posts.reduce((sum: number, p: any) => sum + (parseInt(p.upvotes) || 0), 0);
        const avgUpvotes = Math.round(totalUpvotes / posts.length);
        
        // Analyze post types
        const themes = [];
        if (titles.includes('help') || titles.includes('advice') || titles.includes('question')) {
          themes.push('advice');
        }
        if (titles.includes('review') || titles.includes('recommend') || titles.includes('best')) {
          themes.push('recommendations');
        }
        if (titles.includes('opinion') || titles.includes('think') || titles.includes('feel')) {
          themes.push('opinions');
        }
        if (titles.includes('experience') || titles.includes('story') || titles.includes('happened')) {
          themes.push('experiences');
        }
        if (titles.includes('news') || titles.includes('update') || titles.includes('announcement')) {
          themes.push('news');
        }
        
        return { 
          themes, 
          subreddits, 
          avgUpvotes, 
          relevantCount: relevantPosts.length,
          totalCount: moduleData.posts.length 
        };
      };
      
      // Analyze Pinterest content for specific insights
      const analyzePinterestContent = () => {
        if (!moduleData?.pins || moduleData.pins.length === 0) return null;
        
        const pins = moduleData.pins;
        const titles = pins.map((p: any) => p.title || '').join(' ').toLowerCase();
        const totalLikes = pins.reduce((sum: number, p: any) => sum + (parseInt(p.likes) || 0), 0);
        const avgLikes = Math.round(totalLikes / pins.length);
        
        // Analyze pin types
        const themes = [];
        if (titles.includes('recipe') || titles.includes('food') || titles.includes('cooking')) {
          themes.push('recipes');
        }
        if (titles.includes('fashion') || titles.includes('outfit') || titles.includes('style')) {
          themes.push('fashion');
        }
        if (titles.includes('diy') || titles.includes('craft') || titles.includes('project')) {
          themes.push('DIY');
        }
        if (titles.includes('travel') || titles.includes('vacation') || titles.includes('destination')) {
          themes.push('travel');
        }
        if (titles.includes('decor') || titles.includes('design') || titles.includes('aesthetic')) {
          themes.push('design');
        }
        if (titles.includes('wedding') || titles.includes('party') || titles.includes('celebration')) {
          themes.push('events');
        }
        
        return { themes, avgLikes };
      };
      
      const redditAnalysis = type === 'reddit' ? analyzeRedditContent() : null;
      const pinterestAnalysis = type === 'pinterest' ? analyzePinterestContent() : null;
      
      switch (type) {
        case 'tiktok':
          if (tiktokAnalysis && tiktokAnalysis.themes.length > 0) {
            // Use analyzed content for specific descriptions
            const themeText = tiktokAnalysis.themes.join(', ');
            const creatorText = tiktokAnalysis.creatorText;
            const viewText = tiktokAnalysis.viewText;
            
            // Add relevance information
            const relevanceText = tiktokAnalysis.relevantCount > 0 
              ? ` (${tiktokAnalysis.relevantCount} of ${tiktokAnalysis.totalCount} videos directly related)`
              : '';
            
            let specificMessage = '';
            if (tiktokAnalysis.themes.includes('tutorials')) {
              specificMessage = `Step-by-step tutorials for "${searchQuery}"${creatorText} with an average of ${viewText} views each${relevanceText}. Perfect for visual learners!`;
            } else if (tiktokAnalysis.themes.includes('recipes')) {
              specificMessage = `Quick cooking videos for "${searchQuery}"${creatorText} averaging ${viewText} views${relevanceText}. Easy recipes that actually work!`;
            } else if (tiktokAnalysis.themes.includes('fashion')) {
              specificMessage = `Style inspiration for "${searchQuery}"${creatorText} with ${viewText} average views${relevanceText}. Trendy outfits you can recreate!`;
            } else if (tiktokAnalysis.themes.includes('travel')) {
              specificMessage = `Travel experiences about "${searchQuery}"${creatorText} averaging ${viewText} views${relevanceText}. Real destinations and tips!`;
            } else if (tiktokAnalysis.themes.includes('fitness')) {
              specificMessage = `Workout routines for "${searchQuery}"${creatorText} with ${viewText} average views${relevanceText}. Quick exercises you can do anywhere!`;
            } else if (tiktokAnalysis.themes.includes('beauty')) {
              specificMessage = `Beauty tips for "${searchQuery}"${creatorText} averaging ${viewText} views${relevanceText}. Makeup and skincare that actually works!`;
            } else if (tiktokAnalysis.themes.includes('trending')) {
              specificMessage = `Viral content about "${searchQuery}"${creatorText} with ${viewText} average views${relevanceText}. What everyone is watching right now!`;
            } else if (tiktokAnalysis.themes.includes('DIY')) {
              specificMessage = `Creative projects for "${searchQuery}"${creatorText} averaging ${viewText} views${relevanceText}. Easy DIY ideas you can try!`;
            } else {
              specificMessage = `Popular videos about "${searchQuery}"${creatorText} with ${viewText} average views${relevanceText}. Real experiences and creative content!`;
            }
            
            return {
              title: `🎬 TikTok ${themeText.charAt(0).toUpperCase() + themeText.slice(1)}${contentCount}`,
              message: specificMessage
            };
          } else if (queryLower.includes('how to') || queryLower.includes('tutorial') || queryLower.includes('learn')) {
            return {
              title: `🎬 TikTok Tutorials${contentCount}`,
              message: `Step-by-step video guides and tutorials for "${searchQuery}". Perfect for visual learners!`
            };
          } else if (queryLower.includes('trend') || queryLower.includes('viral') || queryLower.includes('popular')) {
            return {
              title: `🎬 Trending TikTok Content${contentCount}`,
              message: `Viral videos and trending content about "${searchQuery}" that everyone is talking about right now.`
            };
          } else if (queryLower.includes('recipe') || queryLower.includes('food') || queryLower.includes('cooking') || queryLower.includes('meal')) {
            return {
              title: `🎬 TikTok Food & Recipes${contentCount}`,
              message: `Quick cooking videos and recipe ideas for "${searchQuery}" that make cooking fun and easy.`
            };
          } else if (queryLower.includes('fashion') || queryLower.includes('outfit') || queryLower.includes('style') || queryLower.includes('clothing')) {
            return {
              title: `🎬 TikTok Fashion & Style${contentCount}`,
              message: `Fashion trends and style inspiration for "${searchQuery}" from creators who know what looks good.`
            };
          } else if (queryLower.includes('travel') || queryLower.includes('vacation') || queryLower.includes('trip') || queryLower.includes('destination')) {
            return {
              title: `🎬 TikTok Travel Content${contentCount}`,
              message: `Travel experiences and destination guides for "${searchQuery}" from real travelers.`
            };
          } else if (queryLower.includes('fitness') || queryLower.includes('workout') || queryLower.includes('exercise')) {
            return {
              title: `🎬 TikTok Fitness & Workouts${contentCount}`,
              message: `Quick workout routines and fitness tips for "${searchQuery}" to help you stay active.`
            };
          } else if (queryLower.includes('beauty') || queryLower.includes('makeup') || queryLower.includes('skincare')) {
            return {
              title: `🎬 TikTok Beauty & Makeup${contentCount}`,
              message: `Beauty tips and tutorials for "${searchQuery}" from beauty enthusiasts.`
            };
          } else {
            return {
              title: `🎬 TikTok Videos${contentCount}`,
              message: `Short-form videos about "${searchQuery}" showing real experiences and creative content.`
            };
          }
          
        case 'reddit':
          if (redditAnalysis && redditAnalysis.themes.length > 0) {
            // Use analyzed content for specific descriptions
            const themeText = redditAnalysis.themes.join(', ');
            const subredditText = redditAnalysis.subreddits.length > 0 ? ` from r/${redditAnalysis.subreddits.join(', r/')}` : '';
            const upvoteText = redditAnalysis.avgUpvotes > 1000 ? `${(redditAnalysis.avgUpvotes / 1000).toFixed(1)}K` : redditAnalysis.avgUpvotes.toString();
            
            // Add relevance information
            const relevanceText = redditAnalysis.relevantCount > 0 
              ? ` (${redditAnalysis.relevantCount} of ${redditAnalysis.totalCount} posts directly related)`
              : '';
            
            let specificMessage = '';
            if (redditAnalysis.themes.includes('advice')) {
              specificMessage = `Helpful advice about "${searchQuery}"${subredditText} with ${upvoteText} average upvotes${relevanceText}. Real solutions from people who've been there!`;
            } else if (redditAnalysis.themes.includes('recommendations')) {
              specificMessage = `User recommendations for "${searchQuery}"${subredditText} averaging ${upvoteText} upvotes${relevanceText}. Honest reviews to help you decide!`;
            } else if (redditAnalysis.themes.includes('opinions')) {
              specificMessage = `Community opinions on "${searchQuery}"${subredditText} with ${upvoteText} average upvotes${relevanceText}. What people really think!`;
            } else if (redditAnalysis.themes.includes('experiences')) {
              specificMessage = `Personal experiences with "${searchQuery}"${subredditText} averaging ${upvoteText} upvotes${relevanceText}. Real stories from the community!`;
            } else if (redditAnalysis.themes.includes('news')) {
              specificMessage = `Latest discussions about "${searchQuery}"${subredditText} with ${upvoteText} average upvotes${relevanceText}. Community reactions to recent news!`;
            } else {
              specificMessage = `Popular discussions about "${searchQuery}"${subredditText} averaging ${upvoteText} upvotes${relevanceText}. Community insights and experiences!`;
            }
            
            return {
              title: `💬 Reddit ${themeText.charAt(0).toUpperCase() + themeText.slice(1)}${contentCount}`,
              message: specificMessage
            };
          } else if (queryLower.includes('opinion') || queryLower.includes('think') || queryLower.includes('feel') || queryLower.includes('thoughts')) {
            return {
              title: `💬 Reddit Opinions${contentCount}`,
              message: `Community discussions and personal opinions about "${searchQuery}" from real people.`
            };
          } else if (queryLower.includes('review') || queryLower.includes('recommend') || queryLower.includes('best') || queryLower.includes('compare')) {
            return {
              title: `💬 Reddit Recommendations${contentCount}`,
              message: `User reviews and recommendations for "${searchQuery}" from the community to help you decide.`
            };
          } else if (queryLower.includes('help') || queryLower.includes('advice') || queryLower.includes('support') || queryLower.includes('problem')) {
            return {
              title: `💬 Reddit Advice${contentCount}`,
              message: `Helpful advice and support for "${searchQuery}" from people who have been through similar situations.`
            };
          } else if (queryLower.includes('news') || queryLower.includes('update') || queryLower.includes('latest') || queryLower.includes('breaking')) {
            return {
              title: `💬 Reddit News & Updates${contentCount}`,
              message: `Latest discussions and community reactions about "${searchQuery}" and recent developments.`
            };
          } else if (queryLower.includes('experience') || queryLower.includes('story') || queryLower.includes('happened')) {
            return {
              title: `💬 Reddit Stories${contentCount}`,
              message: `Personal experiences and stories about "${searchQuery}" shared by the community.`
            };
          } else {
            return {
              title: `💬 Reddit Discussions${contentCount}`,
              message: `Community discussions and insights about "${searchQuery}" from people who share your interests.`
            };
          }
          
        case 'pinterest':
          if (pinterestAnalysis && pinterestAnalysis.themes.length > 0) {
            // Use analyzed content for specific descriptions
            const themeText = pinterestAnalysis.themes.join(', ');
            const likeText = pinterestAnalysis.avgLikes > 1000 ? `${(pinterestAnalysis.avgLikes / 1000).toFixed(1)}K` : pinterestAnalysis.avgLikes.toString();
            
            let specificMessage = '';
            if (pinterestAnalysis.themes.includes('recipes')) {
              specificMessage = `Beautiful recipe inspiration for "${searchQuery}" with ${likeText} average likes. Food that looks as good as it tastes!`;
            } else if (pinterestAnalysis.themes.includes('fashion')) {
              specificMessage = `Style inspiration for "${searchQuery}" averaging ${likeText} likes. Outfit ideas you can actually recreate!`;
            } else if (pinterestAnalysis.themes.includes('DIY')) {
              specificMessage = `Creative DIY projects for "${searchQuery}" with ${likeText} average likes. Easy crafts and projects to try!`;
            } else if (pinterestAnalysis.themes.includes('travel')) {
              specificMessage = `Travel inspiration for "${searchQuery}" averaging ${likeText} likes. Dream destinations and vacation ideas!`;
            } else if (pinterestAnalysis.themes.includes('design')) {
              specificMessage = `Design inspiration for "${searchQuery}" with ${likeText} average likes. Beautiful aesthetics for your space!`;
            } else if (pinterestAnalysis.themes.includes('events')) {
              specificMessage = `Event planning ideas for "${searchQuery}" averaging ${likeText} likes. Perfect for celebrations and parties!`;
            } else {
              specificMessage = `Popular inspiration for "${searchQuery}" averaging ${likeText} likes. Creative ideas to spark your imagination!`;
            }
            
            return {
              title: `📌 Pinterest ${themeText.charAt(0).toUpperCase() + themeText.slice(1)}${contentCount}`,
              message: specificMessage
            };
          } else if (queryLower.includes('aesthetic') || queryLower.includes('design') || queryLower.includes('decor') || queryLower.includes('interior')) {
            return {
              title: `📌 Pinterest Design Inspiration${contentCount}`,
              message: `Beautiful design ideas and aesthetic inspiration for "${searchQuery}" to transform your space.`
            };
          } else if (queryLower.includes('recipe') || queryLower.includes('food') || queryLower.includes('cooking') || queryLower.includes('meal')) {
            return {
              title: `📌 Pinterest Food & Recipes${contentCount}`,
              message: `Visual recipe inspiration and cooking ideas for "${searchQuery}" that look as good as they taste.`
            };
          } else if (queryLower.includes('fashion') || queryLower.includes('outfit') || queryLower.includes('style') || queryLower.includes('clothing')) {
            return {
              title: `📌 Pinterest Fashion & Style${contentCount}`,
              message: `Fashion inspiration and style ideas for "${searchQuery}" to elevate your look.`
            };
          } else if (queryLower.includes('craft') || queryLower.includes('diy') || queryLower.includes('project') || queryLower.includes('homemade')) {
            return {
              title: `📌 Pinterest DIY & Crafts${contentCount}`,
              message: `Creative DIY projects and craft ideas for "${searchQuery}" that you can make yourself.`
            };
          } else if (queryLower.includes('travel') || queryLower.includes('vacation') || queryLower.includes('trip') || queryLower.includes('destination')) {
            return {
              title: `📌 Pinterest Travel Inspiration${contentCount}`,
              message: `Travel inspiration and destination ideas for "${searchQuery}" to plan your next adventure.`
            };
          } else if (queryLower.includes('wedding') || queryLower.includes('party') || queryLower.includes('celebration')) {
            return {
              title: `📌 Pinterest Event Inspiration${contentCount}`,
              message: `Event planning inspiration and celebration ideas for "${searchQuery}" to make it special.`
            };
          } else {
            return {
              title: `📌 Pinterest Inspiration${contentCount}`,
              message: `Visual inspiration and creative ideas for "${searchQuery}" to spark your imagination.`
            };
          }
          
        default:
          return {
            title: 'Content',
            message: 'Additional content related to your search.'
          };
      }
    };
    
    return generateDescription(moduleType, query, data);
  };

  const styles = createStyles(theme);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>AI is analyzing your search and optimizing the layout...</Text>
      </View>
    );
  }

  if (!layoutConfig) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Enter a search query to see AI-optimized results</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* AI Layout Header - Only show when AI optimized layout is enabled */}
      {showAIOptimizedLayout ? (
        <View style={styles.aiHeader}>
          <View style={styles.aiHeaderContent}>
            <View style={styles.aiHeaderLeft}>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.aiHeaderSpacer} />
      )}

      {/* Perplexity Response - Always at top */}
      {searchResults.gemini?.success && searchResults.gemini.response && (
        <View style={styles.perplexitySection}>
          <GeminiSection data={searchResults.gemini} query={query} onRetry={onRetry} />
        </View>
      )}

      {/* Dynamic Results */}
      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        {showAIOptimizedLayout ? (
          // AI optimized layout - use ordered modules
          orderedModules.map((moduleConfig, index) => {
            const moduleType = moduleConfig.module;
            
            const hasData = moduleDataMap[moduleType]?.success && 
              ((moduleType === 'tiktok' && moduleDataMap[moduleType].videos?.length > 0) ||
               (moduleType === 'reddit' && moduleDataMap[moduleType].posts?.length > 0) ||
               (moduleType === 'pinterest' && moduleDataMap[moduleType].pins?.length > 0));
            
            if (!hasData) return null;
            
            return (
              <View key={`${moduleType}-${index}`} style={styles.resultWrapper}>
                <View style={styles.moduleContent}>
                  {getModuleComponent(moduleType, false)}
                </View>
              </View>
            );
          })
        ) : (
          // Simple layout - show all available modules in order
          (['tiktok', 'reddit', 'pinterest'] as ModuleType[]).map((moduleType) => {
            const hasData = moduleDataMap[moduleType]?.success && 
              ((moduleType === 'tiktok' && moduleDataMap[moduleType].videos?.length > 0) ||
               (moduleType === 'reddit' && moduleDataMap[moduleType].posts?.length > 0) ||
               (moduleType === 'pinterest' && moduleDataMap[moduleType].pins?.length > 0));
            
            if (!hasData) return null;
            
            return (
              <View key={moduleType} style={styles.resultWrapper}>
                <View style={styles.moduleContent}>
                  {getModuleComponent(moduleType, false)}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  aiHeader: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  aiHeaderSpacer: {
    height: 40,
    marginBottom: 16,
  },
  aiHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  aiHeaderTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.textSecondary,
  },
  intentBadge: {
    backgroundColor: theme.colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  intentText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
  },

  perplexitySection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  resultsContainer: {
    flex: 1,
  },
  resultWrapper: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  explanatoryMessage: {
    paddingHorizontal: 4,
    paddingVertical: 8,
    marginBottom: 6,
  },
  explanatoryTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
    marginBottom: 2,
    opacity: 0.8,
  },
  explanatoryText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    lineHeight: 15,
    opacity: 0.7,
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  moduleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moduleTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
  },
  priorityIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 8,
  },
  moduleControls: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    padding: 4,
  },
  moduleContent: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    overflow: 'hidden',
  },
  collapsedContent: {
    minHeight: 80,
  },
  collapsedPlaceholder: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapsedText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  expandButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  expandButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#fff',
  },
  expandHint: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  collapsedPreview: {
    padding: 16,
    backgroundColor: theme.colors.background,
  },
  previewTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  previewText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text,
    lineHeight: 18,
  },
  previewSubtext: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  previewItem: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tiktokThumbnails: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  tiktokThumbnail: {
    width: 80,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 4,
  },
  thumbnailText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#fff',
    textAlign: 'center',
  },
  moreVideosIndicator: {
    width: 80,
    height: 60,
    borderRadius: 8,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreVideosText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
  },
  pinterestThumbnails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  pinterestThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
  },
  morePinsIndicator: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  morePinsText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
  },
}); 