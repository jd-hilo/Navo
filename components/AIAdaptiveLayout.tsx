import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Sparkles, Layout, Grid, List, Maximize2, Minimize2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

// Import all display components
import GeminiSection from './GeminiSection';
import TikTokSection from './TikTokSection';
import RedditSection from './RedditSection';
import PinterestSection from './PinterestSection';

// Import new adaptive display components
// import CompactCard from './displays/CompactCard';
// import DetailedCard from './displays/DetailedCard';
// import GridLayout from './displays/GridLayout';
// import ListLayout from './displays/ListLayout';
// import HeroLayout from './displays/HeroLayout';
// import CarouselLayout from './displays/CarouselLayout';

interface SearchResult {
  type: 'gemini' | 'tiktok' | 'reddit' | 'pinterest';
  data: any;
  priority: number;
  contentType: string;
  userIntent: string;
  optimalLayout: string;
}

interface AIAdaptiveLayoutProps {
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

// AI Layout Analyzer - determines optimal display for each result
const analyzeOptimalLayout = (query: string, results: any): SearchResult[] => {
  const searchResults: SearchResult[] = [];
  
  // Analyze query intent
  const queryLower = query.toLowerCase();
  const isVisualQuery = /image|photo|picture|visual|show|see|look/.test(queryLower);
  const isHowToQuery = /how|tutorial|guide|steps|process/.test(queryLower);
  const isOpinionQuery = /opinion|think|feel|review|experience/.test(queryLower);
  const isNewsQuery = /news|latest|update|breaking|recent/.test(queryLower);
  const isCreativeQuery = /idea|inspiration|creative|design|art/.test(queryLower);
  
  // Analyze Gemini response
  if (results.gemini?.success) {
    const geminiContent = results.gemini.response;
    const hasWebSearch = results.gemini.hasWebSearch;
    const isLongForm = geminiContent.length > 500;
    const isStructured = /^[0-9]\.|^•|^\-|^#/.test(geminiContent);
    
    let optimalLayout = 'detailed';
    let priority = 1;
    
    if (isHowToQuery && isStructured) {
      optimalLayout = 'hero';
      priority = 5;
    } else if (isLongForm && hasWebSearch) {
      optimalLayout = 'detailed';
      priority = 4;
    } else if (isVisualQuery) {
      optimalLayout = 'compact';
      priority = 2;
    } else {
      optimalLayout = 'detailed';
      priority = 3;
    }
    
    searchResults.push({
      type: 'gemini',
      data: results.gemini,
      priority,
      contentType: isStructured ? 'structured' : 'narrative',
      userIntent: isHowToQuery ? 'how-to' : isVisualQuery ? 'visual' : 'information',
      optimalLayout,
    });
  }
  
  // Analyze TikTok results
  if (results.tiktok?.success && results.tiktok.videos?.length > 0) {
    const videoCount = results.tiktok.videos.length;
    const isEntertainmentQuery = /funny|entertainment|viral|trending|dance|music/.test(queryLower);
    
    let optimalLayout = 'grid';
    let priority = 2;
    
    if (isEntertainmentQuery || isVisualQuery) {
      optimalLayout = 'carousel';
      priority = 4;
    } else if (videoCount <= 3) {
      optimalLayout = 'hero';
      priority = 3;
    } else {
      optimalLayout = 'grid';
      priority = 2;
    }
    
    searchResults.push({
      type: 'tiktok',
      data: results.tiktok,
      priority,
      contentType: 'video',
      userIntent: isEntertainmentQuery ? 'entertainment' : 'visual',
      optimalLayout,
    });
  }
  
  // Analyze Reddit results
  if (results.reddit?.success && results.reddit.posts?.length > 0) {
    const postCount = results.reddit.posts.length;
    const isDiscussionQuery = /discussion|opinion|debate|thoughts|experience/.test(queryLower);
    
    let optimalLayout = 'list';
    let priority = 2;
    
    if (isOpinionQuery || isDiscussionQuery) {
      optimalLayout = 'detailed';
      priority = 4;
    } else if (postCount <= 2) {
      optimalLayout = 'hero';
      priority = 3;
    } else {
      optimalLayout = 'list';
      priority = 2;
    }
    
    searchResults.push({
      type: 'reddit',
      data: results.reddit,
      priority,
      contentType: 'discussion',
      userIntent: isOpinionQuery ? 'opinion' : 'information',
      optimalLayout,
    });
  }
  
  // Analyze Pinterest results
  if (results.pinterest?.success && results.pinterest.pins?.length > 0) {
    const pinCount = results.pinterest.pins.length;
    
    let optimalLayout = 'grid';
    let priority = 2;
    
    if (isCreativeQuery || isVisualQuery) {
      optimalLayout = 'carousel';
      priority = 4;
    } else if (pinCount <= 3) {
      optimalLayout = 'hero';
      priority = 3;
    } else {
      optimalLayout = 'grid';
      priority = 2;
    }
    
    searchResults.push({
      type: 'pinterest',
      data: results.pinterest,
      priority,
      contentType: 'visual',
      userIntent: isCreativeQuery ? 'inspiration' : 'visual',
      optimalLayout,
    });
  }
  
  // Sort by priority (highest first)
  return searchResults.sort((a, b) => b.priority - a.priority);
};

// Layout Component Selector
const getLayoutComponent = (result: SearchResult, query: string, onRetry?: () => void) => {
  const { type, data, optimalLayout } = result;
  
  // For now, always use original components until we build the adaptive layouts
  switch (type) {
    case 'gemini':
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

export default function AIAdaptiveLayout({ searchResults, query, onRetry, isLoading }: AIAdaptiveLayoutProps) {
  const { theme } = useTheme();
  const [analyzedResults, setAnalyzedResults] = useState<SearchResult[]>([]);
  const [showLayoutInfo, setShowLayoutInfo] = useState(false);

  useEffect(() => {
    if (!isLoading && searchResults) {
      const results = analyzeOptimalLayout(query, searchResults);
      setAnalyzedResults(results);
    }
  }, [searchResults, query, isLoading]);

  const styles = createStyles(theme);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>AI is analyzing the best way to display your results...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* AI Layout Header */}
      <LinearGradient
        colors={theme.gradients.gemini as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.aiHeader}>
        <View style={styles.aiHeaderContent}>
          <View style={styles.aiHeaderLeft}>
            <Sparkles size={20} color="#fff" />
            <Text style={styles.aiHeaderTitle}>AI-Optimized Layout</Text>
          </View>
          <TouchableOpacity
            style={styles.layoutInfoButton}
            onPress={() => setShowLayoutInfo(!showLayoutInfo)}>
            <Layout size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {showLayoutInfo && (
          <View style={styles.layoutInfo}>
            <Text style={styles.layoutInfoText}>
              AI analyzed your search "{query}" and optimized the layout for the best experience
            </Text>
            <View style={styles.layoutBreakdown}>
              {analyzedResults.map((result, index) => (
                <View key={index} style={styles.layoutItem}>
                  <Text style={styles.layoutItemText}>
                    {result.type.toUpperCase()}: {result.optimalLayout} layout
                  </Text>
                  <Text style={styles.layoutItemSubtext}>
                    Priority: {result.priority} • Intent: {result.userIntent}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </LinearGradient>

      {/* Adaptive Results */}
      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        {analyzedResults.map((result, index) => (
          <View key={`${result.type}-${index}`} style={styles.resultWrapper}>
            {getLayoutComponent(result, query, onRetry)}
          </View>
        ))}
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
  aiHeader: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  aiHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiHeaderTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
    marginLeft: 8,
  },
  layoutInfoButton: {
    padding: 8,
  },
  layoutInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  layoutInfoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
  },
  layoutBreakdown: {
    gap: 4,
  },
  layoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  layoutItemText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#fff',
  },
  layoutItemSubtext: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#fff',
    opacity: 0.7,
  },
  resultsContainer: {
    flex: 1,
  },
  resultWrapper: {
    marginBottom: 16,
  },
}); 