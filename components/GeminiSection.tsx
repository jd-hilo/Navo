import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Image,
  TextInput,
  Keyboard,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Sparkles, Copy, ChevronDown, ChevronUp, RefreshCw, Search, ExternalLink, Database, Trash2 } from 'lucide-react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import MarkdownDisplay from 'react-native-markdown-display';
import { useTheme } from '@/contexts/ThemeContext';
import { quickFollowUp } from '@/services/sonar';
import { getFaviconUrlSync } from '@/utils/faviconUtils';
import TikTokSection from './TikTokSection';
import RedditSection from './RedditSection';
import PinterestSection from './PinterestSection';
import { extractContentData } from '@/services/api';
import { SaveButton } from './SaveButton';

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
  enableFollowUpChat?: boolean;
  tiktokData?: any;
  redditData?: any;
  pinterestData?: any;
  showSaveButton?: boolean;
  showSonarBadge?: boolean;
  onDelete?: () => void;
}

export default function GeminiSection({ data, query, onRetry, isLoading, cached, cacheAge, enableFollowUpChat = false, tiktokData, redditData, pinterestData, showSaveButton = true, showSonarBadge = true, onDelete }: GeminiSectionProps) {
  const { theme, isDark } = useTheme();
  const [copyLoading, setCopyLoading] = useState(false);
  const styles = createStyles(theme, isDark);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [faviconUrls, setFaviconUrls] = useState<Record<string, string>>({});
  const [chatFocused, setChatFocused] = useState(false);
  const cardOffsetY = useRef(new Animated.Value(0)).current;

  const getDomainFromUrl = (url?: string): string | null => {
    if (!url || typeof url !== 'string') return null;
    try {
      const u = new URL(url);
      return u.hostname || null;
    } catch {
      // Fallback simple regex
      const match = url.match(/https?:\/\/([^/]+)/i);
      return match && match[1] ? match[1] : null;
    }
  };

  const getSafeDomain = (source: any): string | null => {
    if (!source) return null;
    const raw = typeof source.domain === 'string' && source.domain.length > 0
      ? source.domain
      : getDomainFromUrl(source.url);
    if (!raw) return null;
    return String(raw).trim();
  };

  // Simple keyboard-aware shift when chat input is focused
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      if (!chatFocused) return;
      const shift = Platform.OS === 'ios' ? -220 : -220;
      Animated.timing(cardOffsetY, {
        toValue: shift,
        duration: 180,
        useNativeDriver: true,
      }).start();
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      Animated.timing(cardOffsetY, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [chatFocused, cardOffsetY]);

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
      
      // Clean up the summary - remove citation numbers and media tokens
      summary = summary
        .replace(/\[\d+\]/g, '') // Remove citation numbers like [1], [2], etc.
        .replace(/\{\{tiktok\}\}/gi, '') // Remove {{tiktok}} tokens
        .replace(/\{\{reddit\}\}/gi, '') // Remove {{reddit}} tokens
        .replace(/\{\{pinterest\}\}/gi, '') // Remove {{pinterest}} tokens
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
      
      // Clean up the content - remove citation numbers and media tokens
      content = content
        .replace(/\[\d+\]/g, '') // Remove citation numbers like [1], [2], etc.
        .replace(/\{\{tiktok\}\}/gi, '') // Remove {{tiktok}} tokens
        .replace(/\{\{reddit\}\}/gi, '') // Remove {{reddit}} tokens
        .replace(/\{\{pinterest\}\}/gi, '') // Remove {{pinterest}} tokens
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
    
    // Clean up the response - remove citation numbers, media tokens, and extra spaces
    const cleanedResponse = unescapedResponse
      .replace(/\[\d+\]/g, '') // Remove citation numbers like [1], [2], etc.
      .replace(/\{\{tiktok\}\}/gi, '') // Remove {{tiktok}} tokens
      .replace(/\{\{reddit\}\}/gi, '') // Remove {{reddit}} tokens
      .replace(/\{\{pinterest\}\}/gi, '') // Remove {{pinterest}} tokens
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

  // Split details by inline media tokens and render sections accordingly
  const renderDetailsWithMedia = () => {
    const parts = (details || '').split(/(\{\{tiktok\}\}|\{\{reddit\}\}|\{\{pinterest\}\})/i);
    return parts.map((part, idx) => {
      const token = part?.toLowerCase?.() || '';
      
      // Check if this is a media token
      if (token === '{{tiktok}}') {
        // Only render if we have valid TikTok data
        if (tiktokData?.success && (tiktokData.videos?.length || 0) > 0) {
          return (
            <View key={`media-${idx}`} style={{ marginVertical: 8 }}>
              <TikTokSection data={tiktokData} query={query} onRetry={onRetry} enableSuggestions={false} />
            </View>
          );
        }
        // Don't render anything if data doesn't exist (hide the token)
        return null;
      }
      
      if (token === '{{reddit}}') {
        // Only render if we have valid Reddit data
        if (redditData?.success && (redditData.posts?.length || 0) > 0) {
          return (
            <View key={`media-${idx}`} style={{ marginVertical: 8 }}>
              <RedditSection data={redditData} query={query} onRetry={onRetry} enableSuggestions={false} />
            </View>
          );
        }
        // Don't render anything if data doesn't exist (hide the token)
        return null;
      }
      
      if (token === '{{pinterest}}') {
        // Only render if we have valid Pinterest data
        if (pinterestData?.success && (pinterestData.pins?.length || 0) > 0) {
          return (
            <View key={`media-${idx}`} style={{ marginVertical: 8 }}>
              <PinterestSection data={pinterestData} query={query} onRetry={onRetry} />
            </View>
          );
        }
        // Don't render anything if data doesn't exist (hide the token)
        return null;
      }
      
      // Only render non-empty text parts as markdown
      if (part && part.trim()) {
        return (
          <MarkdownDisplay key={`md-${idx}`} style={contentMarkdownStyles}>
            {part}
          </MarkdownDisplay>
        );
      }
      
      return null;
    });
  };

  // Generate favicon URLs when sources change
  useEffect(() => {
    if (Array.isArray(data.sources) && data.sources.length > 0) {
      const next: Record<string, string> = {};
      data.sources.forEach((source: any) => {
        const domain = getSafeDomain(source);
        if (domain) {
          const key = domain.toLowerCase();
          next[key] = getFaviconUrlSync(domain, source?.url);
        }
      });
      setFaviconUrls(next);
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

  const summaryMarkdownStyles = createSummaryMarkdownStyles(theme, isDark);
  const contentMarkdownStyles = createContentMarkdownStyles(theme, isDark);

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
    <Animated.View style={[styles.perplexityCard, { transform: [{ translateY: cardOffsetY }] }]}>
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
            {Array.isArray(data.sources) && data.sources.slice(0, 3).map((src: any, index: number) => {
              const domain = getSafeDomain(src);
              if (!domain) return null;
              const key = domain.toLowerCase();
              const favicon = faviconUrls[key];
              return (
                <View key={index} style={styles.sourceIcon}>
                  {favicon ? (
                    <Image 
                      source={{ uri: favicon }} 
                      style={styles.headerFaviconImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={styles.sourceDomainText}>{domain.charAt(0).toUpperCase()}</Text>
                  )}
                </View>
              );
            })}
            {data.sources && data.sources.length > 3 && (
              <View style={styles.sourceIcon}>
                <Text style={styles.profileText}>+{data.sources.length - 3}</Text>
              </View>
            )}
          </View>
          
          {showSaveButton && (
            <View style={styles.saveButtonContainer}>
              <SaveButton
                contentType="gemini"
                contentData={extractContentData('gemini', data)}
                title={`AI Response: ${query}`}
                description={summary}
                size="small"
                variant="icon"
              />
            </View>
          )}
          
          {onDelete && (
            <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={onDelete}
              activeOpacity={0.8}>
              <Trash2 size={16} color="#FFFFFF" strokeWidth={2} />
            </TouchableOpacity>
          )}
          
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
        
        {/* Expanded content - pre-rendered but hidden when collapsed */}
        <View style={[
          styles.expandedContent,
          !isExpanded && { display: 'none' }
        ]}>
          {renderDetailsWithMedia()}
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
                  {Array.isArray(data.sources) && data.sources.map((src: any, index: number) => {
                    const domain = getSafeDomain(src);
                    if (!domain) return null;
                    const key = domain.toLowerCase();
                    const favicon = faviconUrls[key];
                    return (
                      <TouchableOpacity
                        key={index}
                        style={styles.sourceItem}
                        onPress={() => src.url && handleSourcePress(src.url)}
                      >
                        <View style={[styles.sourceIconNew, favicon && { backgroundColor: 'transparent' }]}>
                          {favicon ? (
                            <Image 
                              source={{ uri: favicon }} 
                              style={styles.faviconImage}
                              resizeMode="contain"
                            />
                          ) : (
                            <Text style={styles.sourceDomain}>{domain.charAt(0).toUpperCase()}</Text>
                          )}
                        </View>
                        <View style={styles.sourceContent}>
                          <Text style={styles.sourceTitle} numberOfLines={2}>
                            {src.title || domain}
                          </Text>
                          <Text style={styles.sourceUrl}>{domain}</Text>
                        </View>
                        <ExternalLink size={12} color="#9CA3AF" strokeWidth={2} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}
          <TouchableOpacity style={styles.showMoreButton} onPress={toggleExpanded}>
            <View style={styles.showMoreContent}>
              <View style={styles.showMoreTextContainer}>
                <Text style={styles.showMoreText}>Show less</Text>
                <ChevronUp size={16} color="#5F9CEB" strokeWidth={1.44} />
              </View>
            </View>
          </TouchableOpacity>
        </View>
        
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

        {/* Follow-up mini chat placed under Gemini section regardless of expansion */}
        {enableFollowUpChat && (
          <View style={styles.chatContainer}>
            {!showChat ? (
              <LinearGradient
                colors={theme.gradients.gemini as unknown as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.askMoreGradientBorder}
              >
                <TouchableOpacity style={styles.askMoreButton} onPress={() => setShowChat(true)} activeOpacity={0.8}>
                  <View style={styles.askMoreContent}>
                    <Text style={styles.askMoreText}>Ask more</Text>
                  </View>
                </TouchableOpacity>
              </LinearGradient>
            ) : (
              <View style={styles.chatBox}>
                {messages.length === 0 && (
                  <Text style={styles.chatHint}>Ask a follow-up about "{query}"</Text>
                )}
                {messages.map((m, idx) => (
                  <View key={idx} style={[styles.chatMessage, m.role === 'user' ? styles.chatUser : styles.chatAssistant]}>
                    <Text style={m.role === 'user' ? styles.chatUserText : styles.chatAssistantText}>{m.content}</Text>
                  </View>
                ))}
                <View style={styles.chatInputRow}>
                  <TextInput
                    style={styles.chatInput}
                    value={chatInput}
                    onChangeText={setChatInput}
                    placeholder="Type a follow-up..."
                    placeholderTextColor={theme.colors.textSecondary}
                    onFocus={() => setChatFocused(true)}
                    onBlur={() => setChatFocused(false)}
                  />
                  <TouchableOpacity
                    style={[styles.chatSendButton, (!chatInput.trim() || chatLoading) && { opacity: 0.5 }]}
                    disabled={!chatInput.trim() || chatLoading}
                    onPress={async () => {
                      const question = chatInput.trim();
                      if (!question) return;
                      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
                      setChatInput('');
                      setMessages(prev => [...prev, { role: 'user', content: question }]);
                      setChatLoading(true);
                      try {
                        // Use fast follow-up for quick responses
                        const res = await quickFollowUp(question, query);
                        const answer = res.response || 'No answer available.';
                        setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
                      } catch (e) {
                        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }]);
                      } finally {
                        setChatLoading(false);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    {chatLoading ? (
                      <Text style={styles.typingText}>Navo is searching...</Text>
                    ) : (
                      <Text style={styles.chatSendText}>Send</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
          {showSonarBadge && (
            <View style={styles.modelBadge}>
              <Text style={styles.modelText}>Sonar</Text>
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  perplexityCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    padding: 10,
    gap: 12,
    width: '100%',
    minHeight: 200,
    backgroundColor: isDark ? 'rgba(33, 33, 33, 0.32)' : 'rgba(255, 255, 255, 0.95)',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.25 : 0.15,
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
    color: isDark ? '#FFFFFF' : '#000000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  googleLabel: {
    color: isDark ? '#FFFFFF' : '#000000',
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
    borderColor: isDark ? 'rgba(156, 163, 175, 0.1)' : 'rgba(0, 0, 0, 0.1)',
  },
  wikiText: {
    color: isDark ? '#000000' : '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileText: {
    color: isDark ? '#000000' : '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
  },
  saveButtonContainer: {
    marginRight: 8,
  },
  deleteButton: {
    padding: 4,
    marginRight: 8,
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
    color: isDark ? '#FFFFFF' : '#000000',
    lineHeight: 24,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: isDark ? '#9CA3AF' : '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  showMoreButton: {
    width: '100%',
    height: 48,
    backgroundColor: isDark ? 'rgba(0, 157, 255, 0.05)' : 'rgba(59, 130, 246, 0.1)',
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
    color: isDark ? '#5F9CEB' : '#3B82F6',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 15,
    fontFamily: 'Inter',
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: isDark ? 'rgba(156, 163, 175, 0.2)' : 'rgba(0, 0, 0, 0.1)',
    flex: 1,
  },
  chatContainer: {
    marginTop: 12,
  },
  askMoreButton: {
    alignSelf: 'stretch',
    width: '100%',
    backgroundColor: isDark ? 'rgba(26, 26, 26, 0.92)' : '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
  },
  askMoreGradientBorder: {
    padding: 2,
    borderRadius: 18,
  },
  askMoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  askMoreText: {
    color: isDark ? '#FFFFFF' : '#0F0F0F',
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    textAlign: 'center',
  },
  chatBox: {
    backgroundColor: isDark ? 'rgba(17, 24, 39, 0.6)' : 'rgba(243, 244, 246, 0.8)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(156, 163, 175, 0.2)' : 'rgba(0, 0, 0, 0.08)',
    padding: 12,
  },
  chatHint: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginBottom: 8,
  },
  chatMessage: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 6,
    maxWidth: '85%',
  },
  chatUser: {
    alignSelf: 'flex-end',
    backgroundColor: isDark ? 'rgba(37, 99, 235, 0.45)' : 'rgba(59, 130, 246, 0.2)',
  },
  chatAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: isDark ? 'rgba(75, 85, 99, 0.4)' : 'rgba(209, 213, 219, 0.6)',
  },
  chatUserText: {
    color: isDark ? '#FFFFFF' : '#1F2937',
    fontSize: 14,
  },
  chatAssistantText: {
    color: isDark ? '#FFFFFF' : '#111827',
    fontSize: 14,
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  chatInput: {
    flex: 1,
    height: 40,
    backgroundColor: isDark ? 'rgba(31, 41, 55, 0.8)' : '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(156, 163, 175, 0.2)' : 'rgba(0, 0, 0, 0.08)',
    color: theme.colors.text,
  },
  chatSendButton: {
    height: 40,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.text,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatSendText: {
    color: theme.colors.background,
    fontFamily: 'Inter-Medium',
    fontSize: 13,
  },
  typingText: {
    color: theme.colors.background,
    fontFamily: 'Inter-Medium',
    fontSize: 13,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: isDark ? '#9CA3AF' : '#6B7280',
    marginLeft: 8,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  errorText: {
    fontSize: 14,
    color: isDark ? '#9CA3AF' : '#6B7280',
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
    color: isDark ? '#FFFFFF' : '#000000',
  },
  sourcesToggle: {
    padding: 4,
  },
  showSourcesButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: isDark ? 'rgba(156, 163, 175, 0.1)' : 'rgba(0, 0, 0, 0.05)',
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
    backgroundColor: '#60A5FA',
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

const createSummaryMarkdownStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  body: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: isDark ? '#FFFFFF' : '#000000',
    lineHeight: 24,
    marginBottom: 8,
  },
  heading1: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: isDark ? '#FFFFFF' : '#000000',
    marginVertical: 4,
  },
  heading2: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: isDark ? '#FFFFFF' : '#000000',
    marginVertical: 3,
  },
  heading3: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: isDark ? '#FFFFFF' : '#000000',
    marginVertical: 2,
  },
  strong: {
    fontSize: 20,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: isDark ? '#FFFFFF' : '#000000',
    lineHeight: 25,
  },
  em: {
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
  },
  code_inline: {
    backgroundColor: isDark ? 'rgba(156, 163, 175, 0.2)' : 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  code_block: {
    backgroundColor: isDark ? 'rgba(156, 163, 175, 0.2)' : 'rgba(0, 0, 0, 0.1)',
    padding: 8,
    borderRadius: 6,
    marginVertical: 4,
  },
  list_item: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: isDark ? '#FFFFFF' : '#000000',
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

const createContentMarkdownStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  body: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: isDark ? '#FFFFFF' : '#000000',
    lineHeight: 24,
    marginBottom: 8,
  },
  heading1: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: isDark ? '#FFFFFF' : '#000000',
    marginVertical: 4,
  },
  heading2: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: isDark ? '#FFFFFF' : '#000000',
    marginVertical: 3,
  },
  heading3: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: isDark ? '#FFFFFF' : '#000000',
    marginVertical: 2,
  },
  strong: {
    fontSize: 18, // Same as body text, just bold
    fontFamily: 'Inter-SemiBold',
    color: isDark ? '#FFFFFF' : '#000000',
    lineHeight: 24,
  },
  em: {
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
  },
  code_inline: {
    backgroundColor: isDark ? 'rgba(156, 163, 175, 0.2)' : 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  code_block: {
    backgroundColor: isDark ? 'rgba(156, 163, 175, 0.2)' : 'rgba(0, 0, 0, 0.1)',
    padding: 8,
    borderRadius: 6,
    marginVertical: 4,
  },
  list_item: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: isDark ? '#FFFFFF' : '#000000',
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