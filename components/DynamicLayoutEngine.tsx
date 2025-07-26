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
import GeminiSection from './GeminiSection';
import TikTokSection from './TikTokSection';
import RedditSection from './RedditSection';
import PinterestSection from './PinterestSection';

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
}

interface ModuleState {
  isExpanded: boolean;
  isVisible: boolean;
}

export default function DynamicLayoutEngine({ 
  searchResults, 
  query, 
  onRetry, 
  isLoading 
}: DynamicLayoutEngineProps) {
  const { theme } = useTheme();
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig | null>(null);
  const [moduleStates, setModuleStates] = useState<Record<ModuleType, ModuleState>>({
    google_gemini: { isExpanded: true, isVisible: true },
    tiktok: { isExpanded: true, isVisible: true },
    reddit: { isExpanded: true, isVisible: true },
    pinterest: { isExpanded: true, isVisible: true },
  });


  // Analyze layout when query changes
  useEffect(() => {
    if (query.trim().length > 0) {
      const config = analyzeSearchLayout(query);
      setLayoutConfig(config);
      
      // Initialize module states based on layout config
      const newModuleStates: Record<ModuleType, ModuleState> = {
        google_gemini: { 
          isExpanded: config.layout.find(m => m.module === 'google_gemini')?.display === 'full',
          isVisible: shouldShowModule(config.layout.find(m => m.module === 'google_gemini')?.priority || 'none')
        },
        tiktok: { 
          isExpanded: config.layout.find(m => m.module === 'tiktok')?.display === 'full',
          isVisible: shouldShowModule(config.layout.find(m => m.module === 'tiktok')?.priority || 'none')
        },
        reddit: { 
          isExpanded: config.layout.find(m => m.module === 'reddit')?.display === 'full',
          isVisible: shouldShowModule(config.layout.find(m => m.module === 'reddit')?.priority || 'none')
        },
        pinterest: { 
          isExpanded: config.layout.find(m => m.module === 'pinterest')?.display === 'full',
          isVisible: shouldShowModule(config.layout.find(m => m.module === 'pinterest')?.priority || 'none')
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
    google_gemini: searchResults.gemini,
    tiktok: searchResults.tiktok,
    reddit: searchResults.reddit,
    pinterest: searchResults.pinterest,
  };

  // Get module component mapping
  const getModuleComponent = (moduleType: ModuleType, isCollapsed: boolean = false) => {
    const data = moduleDataMap[moduleType];
    const hasData = data?.success && 
      ((moduleType === 'google_gemini' && data.response) ||
       (moduleType === 'tiktok' && data.videos?.length > 0) ||
       (moduleType === 'reddit' && data.posts?.length > 0) ||
       (moduleType === 'pinterest' && data.pins?.length > 0));

    if (!hasData) return null;

    if (isCollapsed) {
      return getCollapsedPreview(moduleType, data);
    }

    switch (moduleType) {
      case 'google_gemini':
        return <GeminiSection data={data} query={query} onRetry={onRetry} />;
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
      case 'google_gemini':
        const geminiText = data.response || '';
        // Remove markdown formatting for clean preview
        const cleanText = geminiText
          .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **bold** formatting
          .replace(/\*(.*?)\*/g, '$1') // Remove *italic* formatting
          .replace(/`(.*?)`/g, '$1') // Remove `code` formatting
          .replace(/#{1,6}\s/g, '') // Remove headers
          .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links, keep text
          .replace(/\^\^(.*?)\^\^/g, '$1') // Remove ^^ formatting
          .replace(/\^/g, ''); // Remove any remaining ^ symbols
        const previewText = cleanText.split(' ').slice(0, 8).join(' ') + (cleanText.split(' ').length > 8 ? '...' : '');
        return (
          <View style={styles.collapsedPreview}>
            <Text style={styles.previewTitle}>AI Response Preview</Text>
            <Text style={[styles.previewText, { fontFamily: 'Inter-SemiBold' }]}>{previewText}</Text>
          </View>
        );
      
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
      {/* AI Layout Header */}
      <View style={styles.aiHeader}>
        <View style={styles.aiHeaderContent}>
          <View style={styles.aiHeaderLeft}>
            <Image 
              source={require('@/assets/images/organge star.png')} 
              style={styles.starIcon}
            />
            <Text style={styles.aiHeaderTitle}>AI-Optimized Layout</Text>
            <View style={styles.intentBadge}>
              <Text style={styles.intentText}>{layoutConfig.intent.replace('_', ' ')}</Text>
            </View>
          </View>
        </View>
      </View>



      {/* Dynamic Results */}
      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        {orderedModules.map((moduleConfig, index) => {
          const moduleType = moduleConfig.module;
          const moduleState = moduleStates[moduleType];
          
          if (!moduleState.isVisible) return null;

          const hasData = moduleDataMap[moduleType]?.success && 
            ((moduleType === 'google_gemini' && moduleDataMap[moduleType].response) ||
             (moduleType === 'tiktok' && moduleDataMap[moduleType].videos?.length > 0) ||
             (moduleType === 'reddit' && moduleDataMap[moduleType].posts?.length > 0) ||
             (moduleType === 'pinterest' && moduleDataMap[moduleType].pins?.length > 0));
          
          if (!hasData) return null;

          return (
            <View key={`${moduleType}-${index}`} style={styles.resultWrapper}>
              {/* Module Header with Controls */}
              <TouchableOpacity 
                style={styles.moduleHeader}
                onPress={() => moduleConfig.display !== 'full' && toggleModuleExpansion(moduleType)}
                disabled={moduleConfig.display === 'full'}
                activeOpacity={moduleConfig.display === 'full' ? 1 : 0.7}>
                <View style={styles.moduleHeaderLeft}>
                  <Text style={styles.moduleTitle}>
                    {moduleType.replace('_', ' ').toUpperCase()}
                  </Text>
                  <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(moduleConfig.priority) }]} />
                </View>
                <View style={styles.moduleControls}>
                  {moduleConfig.display !== 'full' && (
                    <View style={styles.controlButton}>
                      {moduleState.isExpanded ? <ChevronDown size={16} color={theme.colors.textSecondary} /> : <ChevronLeft size={16} color={theme.colors.textSecondary} />}
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              {/* Module Content */}
              {moduleState.isExpanded ? (
                <View style={styles.moduleContent}>
                  {getModuleComponent(moduleType, false)}
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.moduleContent, styles.collapsedContent]}
                  onPress={() => toggleModuleExpansion(moduleType)}
                  activeOpacity={0.7}>
                  {getModuleComponent(moduleType, true) || (
                    <View style={styles.collapsedPlaceholder}>
                      <Text style={styles.collapsedText}>
                        {moduleType.replace('_', ' ').toUpperCase()} content (collapsed)
                      </Text>
                      <Text style={styles.expandHint}>Tap to expand</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        })}
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

  resultsContainer: {
    flex: 1,
  },
  resultWrapper: {
    marginBottom: 16,
    marginHorizontal: 16,
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
    backgroundColor: theme.colors.card,
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