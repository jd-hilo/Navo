import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Sparkles, Copy, ChevronDown, ChevronUp, RefreshCw, Search, ExternalLink, Database } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Clipboard from '@react-native-clipboard/clipboard';
import MarkdownDisplay from 'react-native-markdown-display';
import { useTheme } from '@/contexts/ThemeContext';

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
    sources?: string[];
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
  const [showSources, setShowSources] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Parse the response to extract summary and details
  const parseResponse = (response: string) => {
    console.log('🔍 Parsing response:', response);
    
    // Find the first two single quotes
    const firstQuoteIndex = response.indexOf("'");
    const secondQuoteIndex = response.indexOf("'", firstQuoteIndex + 1);
    
    console.log('🔍 Quote indices:', { firstQuoteIndex, secondQuoteIndex });
    
    if (firstQuoteIndex !== -1 && secondQuoteIndex !== -1) {
      const summary = response.substring(firstQuoteIndex + 1, secondQuoteIndex).trim();
      // Remove the entire quoted section (including the quotes)
      const beforeQuotes = response.substring(0, firstQuoteIndex).trim();
      const afterQuotes = response.substring(secondQuoteIndex + 1).trim();
      const details = (beforeQuotes + ' ' + afterQuotes).trim();
      
      console.log('🔍 Summary:', summary);
      console.log('🔍 Details:', details);
      
      return { summary, details };
    }
    
    // Fallback if no quotes found
    console.log('🔍 No quotes found, using fallback');
    return { 
      summary: response.substring(0, 100) + '...', 
      details: response 
    };
  };

  const { summary, details } = parseResponse(data.response || '');

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
      Alert.alert('Error', 'Unable to open link');
    }
  };

  const formatCacheAge = (ageMs: number): string => {
    const minutes = Math.floor(ageMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  const styles = createStyles(theme);
  const markdownStyles = createMarkdownStyles(theme);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Show loading state
  if (isLoading) {
    return (
      <LinearGradient
        colors={theme.gradients.gemini as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Sparkles size={20} color={theme.colors.text} strokeWidth={2} />
              <Text style={styles.title}>Gemini</Text>
              <View style={styles.searchingIndicator}>
                <Search size={12} color={theme.colors.indicator.webSearchText} strokeWidth={2} />
                <Text style={styles.searchingText}>Google Search</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.textSecondary} />
            <Text style={styles.loadingText}>Searching web for latest info...</Text>
          </View>
        </View>
      </LinearGradient>
    );
  }

  // Show error state
  if (!data.success && data.error) {
    return (
      <LinearGradient
        colors={theme.gradients.gemini as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Sparkles size={20} color={theme.colors.text} strokeWidth={2} />
              <Text style={styles.title}>Gemini</Text>
              <View style={styles.errorIndicator}>
                <Text style={styles.errorIndicatorText}>Error</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{data.error}</Text>
            {onRetry && (
              <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                <RefreshCw size={16} color={theme.colors.text} strokeWidth={2} />
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>
    );
  }

  // Don't render if no response
  if (!data.response) {
    return null;
  }

  return (
    <LinearGradient
      colors={theme.gradients.gemini as unknown as readonly [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBorder}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Sparkles size={20} color={theme.colors.text} strokeWidth={2} />
            <Text style={styles.title}>Google</Text>
            
            {/* Show cache indicator if data is cached */}
            {cached && cacheAge !== undefined ? (
              <View style={styles.cachedIndicator}>
                <Database size={12} color={theme.colors.indicator.webSearchText} strokeWidth={2} />
                <Text style={styles.cachedText}>
                  Cached • {formatCacheAge(cacheAge)}
                </Text>
              </View>
            ) : (
              /* Always show Google Search indicator since we force search for everything */
              <View style={styles.webSearchIndicator}>
                <Search size={12} color={theme.colors.indicator.webSearchText} strokeWidth={2} />
                <Text style={styles.webSearchText}>Gemini Flash 1.5</Text>
              </View>
            )}
            
            {!data.success && (
              <View style={styles.fallbackIndicator}>
                <Text style={styles.fallbackText}>Sample</Text>
              </View>
            )}
          </View>
          
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleCopy}
              disabled={copyLoading}>
              {copyLoading ? (
                <ActivityIndicator size="small" color={theme.colors.textSecondary} />
              ) : (
                <Copy size={16} color={theme.colors.textSecondary} strokeWidth={2} />
              )}
            </TouchableOpacity>
            
            {details && details.length > 0 && (
              <TouchableOpacity style={styles.actionButton} onPress={toggleExpanded}>
                {isExpanded ? (
                  <ChevronUp size={16} color={theme.colors.textSecondary} strokeWidth={2} />
                ) : (
                  <ChevronDown size={16} color={theme.colors.textSecondary} strokeWidth={2} />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {!data.success && data.error && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>{data.error}</Text>
          </View>
        )}
        
        <View style={styles.content}>
          {/* Summary in bold and large font */}
          <Text style={styles.summaryText}>
            {summary}
          </Text>
          
          {/* Details with expand/collapse */}
          {details && details.length > 0 && (
            <>
              {isExpanded ? (
                <MarkdownDisplay style={markdownStyles}>
                  {details}
                </MarkdownDisplay>
              ) : (
                <Text style={styles.detailsPreview} numberOfLines={2}>
                  {details}
                </Text>
              )}
              
              <TouchableOpacity style={styles.expandButton} onPress={toggleExpanded}>
                <Text style={styles.expandText}>
                  {isExpanded ? 'Show Less' : 'Show More'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Google Search sources - show when available */}
        {data.success && data.sources && data.sources.length > 0 && (
          <View style={styles.sourcesContainer}>
            <TouchableOpacity 
              style={styles.sourcesHeader}
              onPress={() => setShowSources(!showSources)}>
              <Search size={14} color={theme.colors.indicator.webSearchText} strokeWidth={2} />
              <Text style={styles.sourcesTitle}>
                Sources ({data.sources.length})
              </Text>
              <ChevronDown 
                size={14} 
                color={theme.colors.indicator.webSearchText} 
                strokeWidth={2}
                style={[
                  styles.sourcesChevron,
                  showSources && styles.sourcesChevronExpanded
                ]}
              />
            </TouchableOpacity>
            
            {showSources && (
              <View style={styles.sourcesList}>
                {data.sources.map((source, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.sourceItem}
                    onPress={() => handleSourcePress(source)}>
                    <ExternalLink size={12} color={theme.colors.textSecondary} strokeWidth={2} />
                    <Text style={styles.sourceText} numberOfLines={1}>
                      {source.replace(/^https?:\/\//, '').split('/')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Usage stats for successful API calls */}
        {data.success && data.usage && (
          <View style={styles.usageContainer}>
            <Text style={styles.usageText}>
              {data.usage.totalTokenCount} tokens • Google Search enabled
              {cached && ' • From cache'}
            </Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  gradientBorder: {
    borderRadius: 14,
    padding: 1,
    marginBottom: 16,
  },
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
  webSearchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.indicator.webSearch,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  webSearchText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: theme.colors.indicator.webSearchText,
    marginLeft: 2,
  },
  cachedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.indicator.webSearch,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  cachedText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: theme.colors.indicator.webSearchText,
    marginLeft: 2,
  },
  searchingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.indicator.webSearch,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  searchingText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: theme.colors.indicator.webSearchText,
    marginLeft: 2,
  },
  fallbackIndicator: {
    backgroundColor: theme.colors.indicator.fallback,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  fallbackText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: theme.colors.indicator.fallbackText,
  },
  errorIndicator: {
    backgroundColor: theme.colors.indicator.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  errorIndicatorText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: theme.colors.indicator.errorText,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  warningContainer: {
    backgroundColor: theme.colors.warningBackground,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warningBorder,
  },
  warningText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.warningText,
    lineHeight: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.retryButton,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: theme.colors.text,
    marginLeft: 6,
  },
  content: {
    marginBottom: 8,
  },
  expandButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  expandText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: theme.colors.primary,
    textAlign: 'right',
  },
  sourcesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.usageBorder,
  },
  sourcesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  sourcesTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: theme.colors.indicator.webSearchText,
    marginLeft: 6,
    flex: 1,
  },
  sourcesChevron: {
    transform: [{ rotate: '0deg' }],
  },
  sourcesChevronExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  sourcesList: {
    marginTop: 8,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: theme.colors.sourceBackground,
    borderRadius: 6,
    marginBottom: 4,
  },
  sourceText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginLeft: 6,
    flex: 1,
  },
  usageContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.usageBorder,
  },
  usageText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  summaryText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    lineHeight: 24,
    marginBottom: 12,
  },
  detailsPreview: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
});

const createMarkdownStyles = (theme: any) => StyleSheet.create({
  body: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text,
    lineHeight: 18,
  },
  heading1: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginVertical: 4,
  },
  heading2: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginVertical: 3,
  },
  heading3: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginVertical: 2,
  },
  strong: {
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
  },
  em: {
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
  },
  code_inline: {
    backgroundColor: theme.colors.sourceBackground,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  code_block: {
    backgroundColor: theme.colors.sourceBackground,
    padding: 8,
    borderRadius: 6,
    marginVertical: 4,
  },
  list_item: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text,
    lineHeight: 18,
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