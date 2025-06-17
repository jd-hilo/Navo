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
import { MessageSquare, Copy, ChevronDown, ChevronUp, RefreshCw, Zap, Globe, ExternalLink } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Clipboard from '@react-native-clipboard/clipboard';
import MarkdownDisplay from 'react-native-markdown-display';

interface ChatGPTSectionProps {
  data: {
    response: string;
    success: boolean;
    error?: string;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    hasWebSearch?: boolean;
    sources?: string[];
  };
  query: string;
  onRetry?: () => void;
  isLoading?: boolean;
}

export default function ChatGPTSection({ data, query, onRetry, isLoading }: ChatGPTSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copyLoading, setCopyLoading] = useState(false);
  const [showSources, setShowSources] = useState(false);

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

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleSourcePress = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Error', 'Unable to open link');
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <LinearGradient
        colors={['#FFE4E6', '#FFF7ED', '#F3E8FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <MessageSquare size={20} color="#000000" strokeWidth={2} />
              <Text style={styles.title}>ChatGPT</Text>
              <View style={styles.searchingIndicator}>
                <Globe size={12} color="#3B82F6" strokeWidth={2} />
                <Text style={styles.searchingText}>Searching</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#6B6B6B" />
            <Text style={styles.loadingText}>Searching the web and generating response...</Text>
          </View>
        </View>
      </LinearGradient>
    );
  }

  // Show error state
  if (!data.success && data.error) {
    return (
      <LinearGradient
        colors={['#FFE4E6', '#FFF7ED', '#F3E8FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <MessageSquare size={20} color="#000000" strokeWidth={2} />
              <Text style={styles.title}>ChatGPT</Text>
              <View style={styles.errorIndicator}>
                <Text style={styles.errorIndicatorText}>Error</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{data.error}</Text>
            {onRetry && (
              <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                <RefreshCw size={16} color="#000000" strokeWidth={2} />
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

  const shouldTruncate = data.response.length > 300;
  const displayText = shouldTruncate && !isExpanded 
    ? data.response.substring(0, 300) + '...'
    : data.response;

  return (
    <LinearGradient
      colors={['#FFE4E6', '#FFF7ED', '#F3E8FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBorder}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <MessageSquare size={20} color="#000000" strokeWidth={2} />
            <Text style={styles.title}>ChatGPT</Text>
            
            {data.success && data.hasWebSearch && (
              <View style={styles.webSearchIndicator}>
                <Globe size={12} color="#3B82F6" strokeWidth={2} />
                <Text style={styles.webSearchText}>Web Search</Text>
              </View>
            )}
            
            {data.success && !data.hasWebSearch && (
              <View style={styles.liveIndicator}>
                <Zap size={12} color="#10B981" strokeWidth={2} />
                <Text style={styles.liveText}>Live</Text>
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
                <ActivityIndicator size="small" color="#6B6B6B" />
              ) : (
                <Copy size={16} color="#6B6B6B" strokeWidth={2} />
              )}
            </TouchableOpacity>
            
            {shouldTruncate && (
              <TouchableOpacity style={styles.actionButton} onPress={toggleExpanded}>
                {isExpanded ? (
                  <ChevronUp size={16} color="#6B6B6B" strokeWidth={2} />
                ) : (
                  <ChevronDown size={16} color="#6B6B6B" strokeWidth={2} />
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
          <MarkdownDisplay style={markdownStyles}>
            {displayText}
          </MarkdownDisplay>
        </View>

        {shouldTruncate && (
          <TouchableOpacity style={styles.expandButton} onPress={toggleExpanded}>
            <Text style={styles.expandText}>
              {isExpanded ? 'Show Less' : 'Show More'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Web search sources */}
        {data.success && data.hasWebSearch && data.sources && data.sources.length > 0 && (
          <View style={styles.sourcesContainer}>
            <TouchableOpacity 
              style={styles.sourcesHeader}
              onPress={() => setShowSources(!showSources)}>
              <Globe size={14} color="#3B82F6" strokeWidth={2} />
              <Text style={styles.sourcesTitle}>
                Sources ({data.sources.length})
              </Text>
              <ChevronDown 
                size={14} 
                color="#3B82F6" 
                strokeWidth={2}
                style={[
                  styles.sourcesChevron,
                  showSources && styles.sourcesChevronExpanded
                ]}
              />
            </TouchableOpacity>
            
            {showSources && (
              <View style={styles.sourcesList}>
                {data.sources.slice(0, 3).map((source, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.sourceItem}
                    onPress={() => handleSourcePress(source)}>
                    <ExternalLink size={12} color="#6B6B6B" strokeWidth={2} />
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
              {data.usage.total_tokens} tokens used
              {data.hasWebSearch && ' • Web search enabled'}
            </Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBorder: {
    borderRadius: 14,
    padding: 2,
    marginBottom: 16,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
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
    color: '#000000',
    marginLeft: 8,
  },
  webSearchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  webSearchText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#3B82F6',
    marginLeft: 2,
  },
  searchingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  searchingText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#3B82F6',
    marginLeft: 2,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  liveText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#10B981',
    marginLeft: 2,
  },
  fallbackIndicator: {
    backgroundColor: '#F97316',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  fallbackText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  errorIndicator: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  errorIndicatorText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
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
    paddingVertical: 24,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B6B6B',
    marginLeft: 8,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B6B6B',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  warningContainer: {
    backgroundColor: '#FFF7ED',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F97316',
  },
  warningText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9A3412',
    lineHeight: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#000000',
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
    color: '#000000',
  },
  sourcesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  sourcesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  sourcesTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#3B82F6',
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
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    marginBottom: 4,
  },
  sourceText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#6B6B6B',
    marginLeft: 6,
    flex: 1,
  },
  usageContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  usageText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B6B6B',
    textAlign: 'right',
  },
});

const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#000000',
    lineHeight: 20,
  },
  heading1: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
    marginVertical: 8,
  },
  heading2: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
    marginVertical: 6,
  },
  heading3: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
    marginVertical: 4,
  },
  strong: {
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
  },
  em: {
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
  },
  code_inline: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  code_block: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  list_item: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#000000',
    lineHeight: 20,
    marginVertical: 2,
  },
  bullet_list: {
    marginVertical: 4,
  },
  ordered_list: {
    marginVertical: 4,
  },
  paragraph: {
    marginVertical: 4,
  },
});