import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  Image,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Heart, MessageCircle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { AIResponseGenerator } from '@/services/aiResponseGenerator';
import TikTokSection from './TikTokSection';
import RedditSection from './RedditSection';
import PinterestSection from './PinterestSection';

interface RealTimeAIResponseProps {
  query: string;
  searchResults: {
    gemini: any;
    tiktok: any;
    reddit: any;
    pinterest: any;
  };
  onComplete?: () => void;
}

interface StreamingResponse {
  text: string;
  isComplete: boolean;
  aiData?: any;
}

export default function RealTimeAIResponse({ 
  query, 
  searchResults, 
  onComplete 
}: RealTimeAIResponseProps) {
  const { theme, isDark } = useTheme();
  
  console.log('🔍 RealTimeAIResponse - Initial props:', {
    query,
    hasSearchResults: !!searchResults,
    searchResultsKeys: searchResults ? Object.keys(searchResults) : [],
    tiktokVideos: searchResults?.tiktok?.videos?.length || 0,
    redditPosts: searchResults?.reddit?.posts?.length || 0,
    pinterestPins: searchResults?.pinterest?.pins?.length || 0,
    geminiResponse: searchResults?.gemini?.response?.substring(0, 50) + '...'
  });
  const [response, setResponse] = useState<StreamingResponse>({
    text: '',
    isComplete: false
  });
  const [currentSection, setCurrentSection] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const [showSources, setShowSources] = useState(false);
  
  const typingSpeed = 0; // Instant typing
  const sectionDelay = 1000; // ms between sections
  
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const loadingProgress = useRef(new Animated.Value(0)).current;

  // Generate AI response with integrated content
  const generateAIResponse = async () => {
    try {
      const aiData = await AIResponseGenerator.generateIntelligentResponse(query, searchResults);
      return { fullResponse: aiData.mainResponse, aiData };
    } catch (error) {
      console.error('Error generating AI response:', error);
      return { 
        fullResponse: searchResults.gemini?.response || 'I found some information about your query, but I encountered an issue generating a comprehensive response.',
        aiData: null
      };
    }
  };

  // Stream the response
  const streamResponse = async () => {
    setIsGenerating(true);
    
    const { fullResponse, aiData } = await generateAIResponse();
    
    console.log('🔍 RealTimeAIResponse - AI Data received:', {
      hasAiData: !!aiData,
      aiDataKeys: aiData ? Object.keys(aiData) : [],
      hasTikTokSection: !!aiData?.tiktokSection,
      hasRedditSection: !!aiData?.redditSection,
      hasPinterestSection: !!aiData?.pinterestSection,
      responseText: fullResponse?.substring(0, 100) + '...',
      hasTikTokPlaceholder: fullResponse?.includes('{{INSERT_TIKTOK}}'),
      hasRedditPlaceholder: fullResponse?.includes('{{INSERT_REDDIT}}'),
      hasPinterestPlaceholder: fullResponse?.includes('{{INSERT_PINTEREST}}')
    });
    
    setResponse(prev => ({ ...prev, aiData }));
    setIsGenerating(false);
    
    // Show response instantly
    setResponse(prev => ({
      ...prev,
      text: fullResponse,
      isComplete: true
    }));
    
    onComplete?.();
    
    // Fade in sources
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    streamResponse();
  }, []);

  // Start loading animations
  useEffect(() => {
    if (isGenerating) {
      // Loading bar animation
      const barAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(loadingProgress, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(loadingProgress, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ])
      );

      // Start all animations
      barAnimation.start();

      return () => {
        barAnimation.stop();
      };
    }
  }, [isGenerating]);



  const renderTextSection = (text: string) => {
    // Check for factual answer at the top (^^ syntax)
    const factualAnswerMatch = text.match(/\^\^(.*?)\^\^/);
    let factualAnswer = null;
    let remainingText = text;
    
    if (factualAnswerMatch) {
      factualAnswer = factualAnswerMatch[1];
      remainingText = text.replace(/\^\^(.*?)\^\^/, '');
    }
    
    // Parse markdown and handle collapsed sections
    const parseMarkdown = (text: string) => {
      // Handle collapsed sections first
      const sections = text.split(/(<details><summary>.*?<\/summary>)/);
      
      return sections.map((section, sectionIndex) => {
        if (section.startsWith('<details><summary>')) {
          // Extract summary and content
          const summaryMatch = section.match(/<summary>(.*?)<\/summary>/);
          const contentMatch = text.match(/<details><summary>.*?<\/summary>([\s\S]*?)<\/details>/);
          
          if (summaryMatch && contentMatch) {
            return (
              <View key={sectionIndex} style={styles.collapsedSection}>
                <TouchableOpacity 
                  style={styles.collapsedHeader}
                  onPress={() => {
                    // Toggle collapsed state
                    console.log('Toggle collapsed section:', summaryMatch[1]);
                  }}
                >
                  <Text style={styles.collapsedTitle}>{summaryMatch[1]}</Text>
                  <Text style={styles.collapsedIcon}>▼</Text>
                </TouchableOpacity>
                <View style={styles.collapsedContent}>
                  {parseMarkdownContent(contentMatch[1])}
                </View>
              </View>
            );
          }
        }
        
        // Handle regular markdown
        return parseMarkdownContent(section);
      });
    };
    
    const parseMarkdownContent = (text: string) => {
      const lines = text.split('\n');
      return lines.map((line, lineIndex) => {
        // Handle bold text
        const boldParts = line.split(/\*\*(.*?)\*\*/);
        if (boldParts.length > 1) {
          return (
            <Text key={lineIndex} style={styles.responseText}>
              {boldParts.map((part, partIndex) => 
                partIndex % 2 === 1 ? (
                  <Text key={partIndex} style={[styles.responseText, styles.boldText]}>{part}</Text>
                ) : (
                  <Text key={partIndex}>{part}</Text>
                )
              )}
            </Text>
          );
        }
        
        // Handle italic text
        const italicParts = line.split(/\*(.*?)\*/);
        if (italicParts.length > 1) {
          return (
            <Text key={lineIndex} style={styles.responseText}>
              {italicParts.map((part, partIndex) => 
                partIndex % 2 === 1 ? (
                  <Text key={partIndex} style={[styles.responseText, styles.italicText]}>{part}</Text>
                ) : (
                  <Text key={partIndex}>{part}</Text>
                )
              )}
            </Text>
          );
        }
        
        return <Text key={lineIndex} style={styles.responseText}>{line}</Text>;
      });
    };

    // Split text by placeholder tokens and render accordingly
    const renderWithPlaceholders = (text: string) => {
      const parts = text.split(/(\{\{INSERT_TIKTOK\}\}|\{\{INSERT_REDDIT\}\}|\{\{INSERT_PINTEREST\}\})/);
      
      console.log('🔍 renderWithPlaceholders:', {
        textLength: text.length,
        partsCount: parts.length,
        parts: parts.map(p => p.substring(0, 20) + '...'),
        hasTikTokSection: !!response.aiData?.tiktokSection,
        hasRedditSection: !!response.aiData?.redditSection,
        hasPinterestSection: !!response.aiData?.pinterestSection,
        tiktokVideosCount: response.aiData?.tiktokSection?.videos?.length || 0,
        redditPostsCount: response.aiData?.redditSection?.posts?.length || 0,
        pinterestPinsCount: response.aiData?.pinterestSection?.pins?.length || 0
      });
      
      return parts.map((part, index) => {
        if (part === '{{INSERT_TIKTOK}}') {
          console.log('🎯 Rendering TikTok placeholder');
          console.log('🎯 TikTok section data:', response.aiData?.tiktokSection);
          return response.aiData?.tiktokSection ? (
            <View key={index} style={styles.placeholderSection}>
              <TikTokSection 
                data={{ videos: response.aiData.tiktokSection.videos, success: true }}
                query={query}
              />
            </View>
          ) : (
            <Text key={index} style={styles.responseText}>[TikTok section not available]</Text>
          );
        }
        
        if (part === '{{INSERT_REDDIT}}') {
          console.log('🎯 Rendering Reddit placeholder');
          console.log('🎯 Reddit section data:', response.aiData?.redditSection);
          return response.aiData?.redditSection ? (
            <View key={index} style={styles.placeholderSection}>
              <RedditSection 
                data={{ posts: response.aiData.redditSection.posts, success: true }}
                query={query}
              />
            </View>
          ) : (
            <Text key={index} style={styles.responseText}>[Reddit section not available]</Text>
          );
        }
        
        if (part === '{{INSERT_PINTEREST}}') {
          console.log('🎯 Rendering Pinterest placeholder');
          console.log('🎯 Pinterest section data:', response.aiData?.pinterestSection);
          return response.aiData?.pinterestSection ? (
            <View key={index} style={styles.placeholderSection}>
              <PinterestSection 
                data={{ pins: response.aiData.pinterestSection.pins, success: true }}
                query={query}
              />
            </View>
          ) : (
            <Text key={index} style={styles.responseText}>[Pinterest section not available]</Text>
          );
        }
        
        // Regular text content
        return (
          <View key={index} style={styles.textSection}>
            {parseMarkdown(part)}
            {isTyping && index === parts.length - 1 && (
              <View style={styles.cursor}>
                <Text style={[styles.responseText, { color: theme.colors.primary }]}>|</Text>
              </View>
            )}
          </View>
        );
      });
    };

    return (
      <View style={styles.textContainer}>
        {/* Factual Answer at the top */}
        {factualAnswer && (
          <View style={styles.factualAnswerContainer}>
            <Text style={styles.factualAnswerText}>{factualAnswer}</Text>
          </View>
        )}
        
        {/* Main content with placeholders */}
        {renderWithPlaceholders(remainingText)}
      </View>
    );
  };









  const styles = createStyles(theme);

    return (
    <View style={styles.container}>
      {isGenerating ? (
        <View style={styles.loadingScreenContainer}>
          <View style={styles.loadingContent}>
            {/* Animated Loading Bar */}
            <View style={styles.loadingBarContainer}>
              <Animated.View 
                style={[
                  styles.loadingBar, 
                  { 
                    width: loadingProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%']
                    })
                  }
                ]} 
              >
                <LinearGradient
                  colors={['#FF8FA3', '#4A90E2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loadingBarGradient}
                />
              </Animated.View>
            </View>
            
            {/* Fun Loading Text */}
            <Text style={styles.loadingTitle}>Searching Navo</Text>
            <Text style={styles.loadingSubtitle}>AI is analyzing your search and gathering insights...</Text>
          </View>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* AI Response with Embedded Content */}
          {renderTextSection(response.text)}
          
          {/* Sources Section */}
          {response.isComplete && (
            <Animated.View style={[styles.sourcesSection, { opacity: fadeAnim }]}>
              <TouchableOpacity 
                style={styles.sourcesHeader}
                onPress={() => setShowSources(!showSources)}
                activeOpacity={0.7}
              >
                <Text style={styles.sourcesTitle}>Sources & References</Text>
                <Text style={styles.sourcesCount}>
                  {response.aiData?.sources?.length || 0} sources
                </Text>
              </TouchableOpacity>
              
              {showSources && (
                <View style={styles.sourcesList}>
                                  {response.aiData?.sources?.map((source: any, index: number) => (
                  <View key={index} style={styles.sourceItem}>
                    <Text style={styles.sourceType}>
                      {source.type}
                    </Text>
                    <Text style={styles.sourceRelevance}>
                      {Math.round(source.relevance * 100)}% relevant
                    </Text>
                  </View>
                ))}
                </View>
              )}
            </Animated.View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  loadingTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  loadingBarContainer: {
    width: '100%',
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    marginBottom: 24,
    overflow: 'hidden',
  },
  loadingBar: {
    height: '100%',
    borderRadius: 2,
  },
  loadingBarGradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  sectionSummary: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  horizontalScroll: {
    marginHorizontal: -8,
  },
  tiktokCard: {
    width: 200,
    marginHorizontal: 8,
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tiktokThumbnail: {
    width: '100%',
    height: 120,
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tiktokInfo: {
    padding: 12,
  },

  redditCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  redditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subredditName: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.primary,
  },
  postAuthor: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
  },
  postTitle: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginBottom: 6,
    lineHeight: 20,
  },
  postPreview: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  redditStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
  },

  // TikTok Styles
  gradientBorder: {
    borderRadius: 14,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginLeft: 8,
  },
  videosContainer: {
    paddingRight: 80,
  },
  videoCardWrapper: {
    width: 320,
    marginLeft: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: theme.colors.card,
  },
  firstVideo: {
    marginLeft: 0,
  },
  videoCard: {
    width: 320, 
    height: 400, 
    borderRadius: 12, 
    overflow: 'hidden', 
    backgroundColor: theme.colors.card 
  },
  videoCardContent: {
    flex: 1, 
    position: 'relative' 
  },
  videoThumbnail: {
    flex: 1 
  },
  playOverlay: {
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  videoInfo: {
    padding: 12,
  },
  videoTitle: {
    fontSize: 14, 
    fontFamily: 'Inter-Medium', 
    color: theme.colors.text, 
    lineHeight: 18, 
    marginBottom: 4 
  },
  videoAuthor: {
    fontSize: 12, 
    fontFamily: 'Inter-Regular', 
    color: theme.colors.textSecondary, 
    marginBottom: 2 
  },
  videoViews: {
    fontSize: 12, 
    fontFamily: 'Inter-Regular', 
    color: theme.colors.textSecondary 
  },
  swipeHint: {
    alignItems: 'center', 
    marginTop: 6, 
    marginBottom: 2 
  },
  swipeText: {
    fontSize: 13, 
    color: theme.colors.textSecondary, 
    fontFamily: 'Inter-Medium' 
  },
  // Pinterest Styles
  pinsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  leftColumn: {
    width: '48%',
  },
  rightColumn: {
    width: '48%',
  },
  pinCard: {
    width: '100%',
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  pinImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 6,
  },
  pinTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: theme.colors.text,
    lineHeight: 18,
    paddingHorizontal: 2,
    marginBottom: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  textSection: {
    marginBottom: 24,
  },
  textContainer: {
    flex: 1,
  },
  placeholderSection: {
    marginVertical: 16,
  },
  factualAnswerContainer: {
    backgroundColor: theme.colors.primary + '20',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  factualAnswerText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text,
    lineHeight: 24,
  },
  collapsedSection: {
    marginVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.card,
    overflow: 'hidden',
  },
  collapsedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.colors.border,
  },
  collapsedTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: theme.colors.text,
  },
  collapsedIcon: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  collapsedContent: {
    padding: 12,
  },
  responseText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text,
    lineHeight: 24,
  },
  boldText: {
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  italicText: {
    fontStyle: 'italic',
  },
  cursor: {
    marginLeft: 2,
  },

  sourcesSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  sourcesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  sourcesTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
  },
  sourcesCount: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
  },
  sourcesList: {
    marginTop: 8,
  },
  sourceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    marginBottom: 4,
  },
  sourceType: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: theme.colors.text,
  },
  sourceRelevance: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
  },
}); 