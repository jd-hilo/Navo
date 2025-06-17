import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MessageCircle, ArrowUp, Award, ExternalLink, RefreshCw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

interface RedditPost {
  id: string;
  title: string;
  subreddit: string;
  author: string;
  upvotes: number;
  awards: number;
  comments: number;
  preview: string;
  text: string;
  url: string;
  created: string;
  media?: string | null;
  thumbnail?: string | null;
}

interface RedditSectionProps {
  data: {
    posts: RedditPost[];
    success: boolean;
    error?: string;
  };
  query: string;
  onRetry?: () => void;
  isLoading?: boolean;
}

export default function RedditSection({ data, query, onRetry, isLoading }: RedditSectionProps) {
  const { theme } = useTheme();

  const handlePostPress = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening Reddit post:', error);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const styles = createStyles(theme);

  // Show loading state
  if (isLoading) {
    return (
      <LinearGradient
        colors={theme.gradients.reddit}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <MessageCircle size={20} color={theme.colors.text} strokeWidth={2} />
              <Text style={styles.title}>Reddit</Text>
              <View style={styles.liveIndicator}>
                <Text style={styles.liveText}>Live</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.textSecondary} />
            <Text style={styles.loadingText}>Searching Reddit posts...</Text>
          </View>
        </View>
      </LinearGradient>
    );
  }

  // Show error state
  if (!data.success && data.error) {
    return (
      <LinearGradient
        colors={theme.gradients.reddit}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <MessageCircle size={20} color={theme.colors.text} strokeWidth={2} />
              <Text style={styles.title}>Reddit</Text>
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

  // Don't render if no posts
  if (!data.posts || data.posts.length === 0) {
    return (
      <LinearGradient
        colors={theme.gradients.reddit}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <MessageCircle size={20} color={theme.colors.text} strokeWidth={2} />
              <Text style={styles.title}>Reddit</Text>
              <View style={styles.fallbackIndicator}>
                <Text style={styles.fallbackText}>No Posts</Text>
              </View>
            </View>
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>No Reddit posts found for this search.</Text>
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

  return (
    <LinearGradient
      colors={theme.gradients.reddit}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBorder}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <MessageCircle size={20} color={theme.colors.text} strokeWidth={2} />
            <Text style={styles.title}>Reddit</Text>
            
            {data.success ? (
              <View style={styles.liveIndicator}>
                <Text style={styles.liveText}>Live</Text>
              </View>
            ) : (
              <View style={styles.fallbackIndicator}>
                <Text style={styles.fallbackText}>Sample</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.actionButton}>
            <ExternalLink size={16} color={theme.colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {!data.success && data.error && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>{data.error}</Text>
          </View>
        )}

        <ScrollView showsVerticalScrollIndicator={false}>
          {data.posts.slice(0, 5).map((post, index) => (
            <TouchableOpacity
              key={post.id}
              style={[styles.postCard, index === data.posts.length - 1 && styles.lastPost]}
              onPress={() => handlePostPress(post.url)}>
              <View style={styles.postHeader}>
                <Text style={styles.subreddit}>r/{post.subreddit}</Text>
                <Text style={styles.author}>u/{post.author}</Text>
                <Text style={styles.time}>{post.created}</Text>
              </View>
              
              <Text style={styles.postTitle} numberOfLines={2}>
                {post.title}
              </Text>
              
              {(post.text || post.preview) && (
                <Text style={styles.postPreview} numberOfLines={3}>
                  {post.text || post.preview}
                </Text>
              )}
              
              <View style={styles.postStats}>
                <View style={styles.statItem}>
                  <ArrowUp size={14} color={theme.colors.textSecondary} strokeWidth={2} />
                  <Text style={styles.statText}>{formatNumber(post.upvotes)}</Text>
                </View>
                
                <View style={styles.statItem}>
                  <MessageCircle size={14} color={theme.colors.textSecondary} strokeWidth={2} />
                  <Text style={styles.statText}>{formatNumber(post.comments)}</Text>
                </View>
                
                {post.awards > 0 && (
                  <View style={styles.statItem}>
                    <Award size={14} color={theme.colors.textSecondary} strokeWidth={2} />
                    <Text style={styles.statText}>{formatNumber(post.awards)}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  gradientBorder: {
    borderRadius: 14,
    padding: 2,
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
  liveIndicator: {
    backgroundColor: theme.colors.indicator.webSearch,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  liveText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: theme.colors.indicator.webSearchText,
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
  actionButton: {
    padding: 8,
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
  postCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  lastPost: {
    borderBottomWidth: 0,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  subreddit: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginRight: 8,
  },
  author: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
  },
  postTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    lineHeight: 18,
    marginBottom: 6,
  },
  postPreview: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
});