import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import { Sparkles, Copy, ChevronDown, ChevronUp, RefreshCw, Search, ExternalLink, Database } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Clipboard from '@react-native-clipboard/clipboard';
import MarkdownDisplay from 'react-native-markdown-display';
import { useTheme } from '@/contexts/ThemeContext';
import { getFaviconUrlSync } from '@/utils/faviconUtils';

interface GeminiSectionProps {
  data: {
    response: string;
    success: boolean;
    error?: string;
    usage?: {
      promptTokenCount: number;
      candidatesTokenCount: number;
      totalTokenCount: number;
    };
    hasWebSearch?: boolean;
    sources?: Array<{
      title: string;
      url: string;
      domain: string;
    }>;
    groundingMetadata?: any;
  };
  query: string;
  onRetry?: () => void;
  isLoading?: boolean;
  cached?: boolean;
  cacheAge?: number;
}

export default function GeminiSection({ data, query, onRetry, isLoading, cached, cacheAge }: GeminiSectionProps) {
  const { theme } = useTheme();
  const [copyLoading, setCopyLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(false);
  const [faviconUrls, setFaviconUrls] = useState<Record<string, string>>({});

  // Parse the response to extract summary and details
  const parseResponse = (response: string) => {
    console.log('🔍 Parsing response:', response);
    
    // Unescape the response to handle backslashes properly - only remove backslashes before U.S.
    const unescapedResponse = response.replace(/\\U\.S\./g, 'U.S.');
    console.log('🔍 Unescaped response:', unescapedResponse);
    
    // Find the first two carets
    const firstCaretIndex = unescapedResponse.indexOf("^^");
    const secondCaretIndex = unescapedResponse.indexOf("^^", firstCaretIndex + 2);
    
    console.log('🔍 Caret indices:', { firstCaretIndex, secondCaretIndex });
    
    if (firstCaretIndex !== -1 && secondCaretIndex !== -1) {
      // Standard format: ^^ summary ^^ details
      let summary = unescapedResponse.substring(firstCaretIndex + 2, secondCaretIndex).trim();
      
      // Clean up the summary - remove citation numbers
      summary = summary
        .replace(/\[\d+\]/g, '') // Remove citation numbers like [1], [2], etc.
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();
      
      // Limit summary to ~1500 characters to stay within token limits
      if (summary.length > 1500) {
        summary = summary.substring(0, 1500).trim();
        // Try to end at a sentence boundary
        const lastPeriod = summary.lastIndexOf('.');
        const lastExclamation = summary.lastIndexOf('!');
        const lastQuestion = summary.lastIndexOf('?');
        const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
        if (lastSentenceEnd > 1200) { // Only cut at sentence if we have enough content
          summary = summary.substring(0, lastSentenceEnd + 1);
        }
      }
      
      // Make the summary bold by wrapping it in markdown bold formatting
      summary = `**${summary}**`;
      
      const beforeCarets = unescapedResponse.substring(0, firstCaretIndex).trim();
      const afterCarets = unescapedResponse.substring(secondCaretIndex + 2).trim();
      const details = (beforeCarets + ' ' + afterCarets).trim();
      
      console.log('🔍 Summary:', summary);
      console.log('🔍 Details:', details);
      
      return { summary, details };
    } else if (firstCaretIndex !== -1 && secondCaretIndex === -1) {
      // Only one set of carets at the beginning: ^^ content...
      let content = unescapedResponse.substring(firstCaretIndex + 2).trim();
      
      // Clean up the content - remove citation numbers
      content = content
        .replace(/\[\d+\]/g, '') // Remove citation numbers like [1], [2], etc.
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();
      
      // Limit content to ~1500 characters to stay within token limits
      if (content.length > 1500) {
        content = content.substring(0, 1500).trim();
        // Try to end at a sentence boundary
        const lastPeriod = content.lastIndexOf('.');
        const lastExclamation = content.lastIndexOf('!');
        const lastQuestion = content.lastIndexOf('?');
        const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
        if (lastSentenceEnd > 1200) { // Only cut at sentence if we have enough content
          content = content.substring(0, lastSentenceEnd + 1);
        }
      }
      
      // Make the summary bold by wrapping it in markdown bold formatting
      const summary = `**${content}**`;
      const details = content;
      
      console.log('🔍 Single caret format - Summary:', summary);
      console.log('🔍 Single caret format - Details:', details);
      
      return { summary, details };
    }
    
    // Fallback if no carets found
    console.log('🔍 No carets found, using fallback');
    
    // Clean up the response - remove citation numbers and extra spaces
    const cleanedResponse = unescapedResponse
      .replace(/\[\d+\]/g, '') // Remove citation numbers like [1], [2], etc.
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
    
    // Limit response to ~1500 characters to stay within token limits
    let limitedResponse = cleanedResponse;
    if (limitedResponse.length > 1500) {
      limitedResponse = limitedResponse.substring(0, 1500).trim();
      // Try to end at a sentence boundary
      const lastPeriod = limitedResponse.lastIndexOf('.');
      const lastExclamation = limitedResponse.lastIndexOf('!');
      const lastQuestion = limitedResponse.lastIndexOf('?');
      const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
      if (lastSentenceEnd > 1200) { // Only cut at sentence if we have enough content
        limitedResponse = limitedResponse.substring(0, lastSentenceEnd + 1);
      }
    }
    
    // Make the summary bold
    const formattedSummary = `**${limitedResponse}**`;
    
    return { 
      summary: formattedSummary, 
      details: limitedResponse 
    };
  };

  const { summary, details } = parseResponse(data.response || '');

  // Generate favicon URLs when sources change
  useEffect(() => {
    if (data.sources && data.sources.length > 0) {
      const newFaviconUrls: Record<string, string> = {};
      data.sources.forEach(source => {
        const faviconUrl = getFaviconUrlSync(source.domain, source.url);
        newFaviconUrls[source.domain] = faviconUrl;
      });
      setFaviconUrls(newFaviconUrls);
    }
  }, [data.sources]);

  const handleCopy = async () => {
    if (data.response) {
      setCopyLoading(true);
      try {
        Clipboard.setString(data.response);
        Alert.alert('Copied', 'Response copied to clipboard', [{ text: 'OK' }]);
      } catch (error) {
        Alert.alert('Error', 'Failed to copy to clipboard');
      } finally {
        setCopyLoading(false);
      }
    }
  };

  const handleSourcePress = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Error', 'Could not open link');
    }
  };

  const formatCacheAge = (ageMs: number): string => {
    const minutes = Math.floor(ageMs / (1000 * 60));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleSourcesExpanded = () => {
    setIsSourcesExpanded(!isSourcesExpanded);
  };

  const summaryMarkdownStyles = createSummaryMarkdownStyles(theme);
  const contentMarkdownStyles = createContentMarkdownStyles(theme);

  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.perplexityCard}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.googleLogo}>
              <Text style={styles.googleText}>P</Text>
            </View>
            <Text style={styles.googleLabel}>Perplexity</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.sourceIcons}>
              <View style={styles.sourceIcon}>
                <Search size={12} color="#9CA3AF" strokeWidth={2} />
              </View>
              <View style={styles.sourceIcon}>
                <Text style={styles.wikiText}>W</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.copyButton}>
              <Copy size={16} color="#9CA3AF" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#9CA3AF" />
          <Text style={styles.loadingText}>Searching web for latest info...</Text>
        </View>
      </View>
    );
  }

  // Show error state
  if (!data.success && data.error) {
    const isOverloadError = data.error.includes('overloaded') || data.error.includes('503');
    const isRateLimitError = data.error.includes('rate limit') || data.error.includes('429');
    
    return (
      <View style={styles.perplexityCard}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.googleLogo}>
              <Text style={styles.googleText}>P</Text>
            </View>
            <Text style={styles.googleLabel}>Perplexity</Text>
          </View>
        </View>
        
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {isOverloadError 
              ? 'Perplexity Sonar is currently experiencing high traffic. Please try again in a moment.'
              : isRateLimitError
              ? 'Too many requests to Perplexity Sonar. Please wait a moment before trying again.'
              : data.error
            }
          </Text>
          {onRetry && (
            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
              <RefreshCw size={16} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.retryText}>
                {isOverloadError ? 'Try Again' : 'Retry'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // Don't render if no response
  if (!data.response) {
    return null;
  }

  return (
    <View style={styles.perplexityCard}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Image 
            source={require('@/assets/images/blue.png')} 
            style={styles.perplexityLogo}
          />
          <Text style={styles.googleLabel}>Perplexity</Text>
        </View>
        
        <View style={styles.headerRight}>
          <View style={styles.sourceIcons}>
            {data.sources && data.sources.slice(0, 3).map((source, index) => (
              <View key={index} style={styles.sourceIcon}>
                {faviconUrls[source.domain] ? (
                  <Image 
                    source={{ uri: faviconUrls[source.domain] }} 
                    style={styles.headerFaviconImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={styles.sourceDomainText}>{source.domain.charAt(0).toUpperCase()}</Text>
                )}
              </View>
            ))}
            {data.sources && data.sources.length > 3 && (
              <View style={styles.sourceIcon}>
                <Text style={styles.profileText}>+{data.sources.length - 3}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity 
            style={styles.copyButton} 
            onPress={handleCopy}
            disabled={copyLoading}>
            {copyLoading ? (
              <ActivityIndicator size="small" color="#9CA3AF" />
            ) : (
              <Copy size={16} color="#9CA3AF" strokeWidth={2} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cardContent}>
        {/* Main answer with proper markdown formatting */}
        <MarkdownDisplay style={summaryMarkdownStyles}>
          {summary}
        </MarkdownDisplay>
        
        {/* Show more button - only show when not expanded */}
        {!isExpanded && (
          <TouchableOpacity style={styles.showMoreButton} onPress={toggleExpanded}>
            <View style={styles.showMoreContent}>
              <View style={styles.showMoreTextContainer}>
                <Text style={styles.showMoreText}>Show more</Text>
                <ChevronDown size={16} color="#5F9CEB" strokeWidth={1.44} />
              </View>
            </View>
          </TouchableOpacity>
        )}
        
        {/* Expanded content - shows directly under the summary */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            <MarkdownDisplay style={contentMarkdownStyles}>
              {details}
            </MarkdownDisplay>
            
            {/* Sources section - in expanded content */}
            {data.sources && data.sources.length > 0 && (
              <View style={styles.sourcesContainer}>
                <TouchableOpacity 
                  style={styles.sourcesHeader} 
                  onPress={toggleSourcesExpanded}
                  activeOpacity={0.7}
                >
                  <Text style={styles.sourcesTitle}>Sources ({data.sources.length})</Text>
                  {isSourcesExpanded ? (
                    <ChevronUp size={16} color="#9CA3AF" strokeWidth={2} />
                  ) : (
                    <ChevronDown size={16} color="#9CA3AF" strokeWidth={2} />
                  )}
                </TouchableOpacity>
                
                {isSourcesExpanded && (
                  <View style={styles.sourcesList}>
                    {data.sources.map((source, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.sourceItem}
                        onPress={() => handleSourcePress(source.url)}
                      >
                        <View style={[
                          styles.sourceIconNew,
                          faviconUrls[source.domain] && { backgroundColor: 'transparent' }
                        ]}>
                          {faviconUrls[source.domain] ? (
                            <Image 
                              source={{ uri: faviconUrls[source.domain] }} 
                              style={styles.faviconImage}
                              resizeMode="contain"
                            />
                          ) : (
                            <Text style={styles.sourceDomain}>{source.domain.charAt(0).toUpperCase()}</Text>
                          )}
                        </View>
                        <View style={styles.sourceContent}>
                          <Text style={styles.sourceTitle} numberOfLines={2}>
                            {source.title}
                          </Text>
                          <Text style={styles.sourceUrl}>{source.domain}</Text>
                        </View>
                        <ExternalLink size={12} color="#9CA3AF" strokeWidth={2} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
            
            {/* Show less button - at bottom of expanded content */}
            <TouchableOpacity style={styles.showMoreButton} onPress={toggleExpanded}>
              <View style={styles.showMoreContent}>
                <View style={styles.showMoreTextContainer}>
                  <Text style={styles.showMoreText}>Show less</Text>
                  <ChevronUp size={16} color="#5F9CEB" strokeWidth={1.44} />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Usage stats at bottom */}
      {data.success && data.usage && (
        <View style={styles.usageContainer}>
          <Text style={styles.usageText}>
            {data.usage.totalTokenCount} tokens • Perplexity Search enabled
            {cached && ' • From cache'}
          </Text>
          <View style={styles.modelBadge}>
            <Text style={styles.modelText}>Sonar</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  perplexityCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    padding: 10,
    gap: 12,
    width: '100%',
    minHeight: 200,
    backgroundColor: 'rgba(33, 33, 33, 0.32)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 39.1,
    borderRadius: 32,
    // Note: backdrop-filter is not supported in React Native
    // We'll use a semi-transparent background instead
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleLogo: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  perplexityLogo: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  googleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  googleLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  sourceIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8, // Overlapping effect
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.1)',
  },
  wikiText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '500',
  },
  copyButton: {
    padding: 4,
  },
  cardContent: {
    width: '100%',
    paddingHorizontal: 8,
    flex: 1,
  },
  mainAnswer: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 24,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
    marginBottom: 12,
  },
  showMoreButton: {
    width: '100%',
    height: 48,
    backgroundColor: 'rgba(0, 157, 255, 0.05)',
    borderRadius: 28,
    padding: 16,
    marginTop: 12,
  },
  showMoreContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  showMoreTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  showMoreText: {
    color: '#5F9CEB',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 15,
    fontFamily: 'Inter',
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(156, 163, 175, 0.2)',
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  sourcesContainer: {
    width: '100%',
    paddingHorizontal: 8,
    paddingTop: 12,
  },
  sourcesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourcesList: {
    width: '100%',
  },
  sourcesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sourcesToggle: {
    padding: 4,
  },
  showSourcesButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
  },
  showSourcesText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  faviconImage: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  headerFaviconImage: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  sourceDomainText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#000000',
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
    borderRadius: 8,
    marginBottom: 6,
  },
  sourceIconNew: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sourceDomain: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sourceContent: {
    flex: 1,
    marginRight: 8,
  },
  sourceTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
    lineHeight: 16,
  },
  sourceUrl: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  usageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  usageText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  modelBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modelText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

const createSummaryMarkdownStyles = (theme: any) => StyleSheet.create({
  body: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    lineHeight: 24,
    marginBottom: 8,
  },
  heading1: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginVertical: 4,
  },
  heading2: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginVertical: 3,
  },
  heading3: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginVertical: 2,
  },
  strong: {
    fontSize: 20,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 25,
  },
  em: {
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
  },
  code_inline: {
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  code_block: {
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
    padding: 8,
    borderRadius: 6,
    marginVertical: 4,
  },
  list_item: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    lineHeight: 24,
    marginVertical: 1,
  },
  bullet_list: {
    marginVertical: 2,
  },
  ordered_list: {
    marginVertical: 2,
  },
  paragraph: {
    marginVertical: 2,
  },
});

const createContentMarkdownStyles = (theme: any) => StyleSheet.create({
  body: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    lineHeight: 24,
    marginBottom: 8,
  },
  heading1: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginVertical: 4,
  },
  heading2: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginVertical: 3,
  },
  heading3: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginVertical: 2,
  },
  strong: {
    fontSize: 18, // Same as body text, just bold
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  em: {
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
  },
  code_inline: {
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  code_block: {
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
    padding: 8,
    borderRadius: 6,
    marginVertical: 4,
  },
  list_item: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    lineHeight: 24,
    marginVertical: 1,
  },
  bullet_list: {
    marginVertical: 2,
  },
  ordered_list: {
    marginVertical: 2,
  },
  paragraph: {
    marginVertical: 2,
  },
});