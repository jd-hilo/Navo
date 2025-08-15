import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
  ActivityIndicator,
  Modal,
  Pressable,
  Image,
} from 'react-native';
import { MessageCircle, ArrowUp, Award, ExternalLink, RefreshCw, Share2, ChevronDown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { fetchRedditComments } from '@/services/api';

// In-memory cache for Reddit suggestions per query
const redditSuggestionCache: Record<string, string[]> = {};
interface RedditPost {
  id: string;
  title: string;
  subreddit: string;
  upvotes: number;
  awards: number;
  comments: number;
  preview: string;
  text?: string;
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
  enableSuggestions?: boolean;
}

interface RedditComment {
  id: string;
  content?: {
    markdown: string;
  };
  score: number;
  createdAt: string;
  depth?: number;
  replies?: RedditComment[];
  author?: string;
  authorName?: string;
  username?: string;
}

export default function RedditSection({ data, query, onRetry, isLoading, enableSuggestions = false }: RedditSectionProps) {
  const { theme, isDark } = useTheme();
  const styles = createStyles(theme, isDark);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<RedditPost | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [modalAnimation, setModalAnimation] = useState<'fade' | 'none'>('fade');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState<string | null>(null);
  const [morePosts, setMorePosts] = useState<RedditPost[] | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  React.useEffect(() => {
    let mounted = true;
    const gen = async () => {
      if (!enableSuggestions || !query) return;
      if (redditSuggestionCache[query]) {
        if (mounted) setSuggestions(redditSuggestionCache[query]);
        return;
      }
      try {
        setLoadingSuggestions(true);
        const { quickFollowUp } = await import('@/services/sonar');
        // Use same prompt format as TikTok suggestions for consistent parsing
        const res = await quickFollowUp(`Give 3-5 short Reddit search ideas related to: ${query}. Return as comma-separated phrases only.`);
        const text = (res.response || '').replace(/\n/g, ' ').trim();
        let items: string[] = [];
        if (text.includes(',')) {
          items = text.split(',').map(s => s.trim()).filter(Boolean).slice(0, 5);
        } else {
          items = text.split(/\s*[-•]\s*|\s*\d+\.\s*/).map(s => s.trim()).filter(Boolean).slice(0, 5);
        }
        redditSuggestionCache[query] = items;
        if (mounted) setSuggestions(items);
      } catch (e) {
        if (mounted) setSuggestions([]);
      } finally {
        if (mounted) setLoadingSuggestions(false);
      }
    };
    gen();
    return () => { mounted = false; };
  }, [query, enableSuggestions]);

  const handleSuggestionPress = async (phrase: string) => {
    setActiveSuggestion(phrase);
    setLoadingMore(true);
    try {
      const { searchReddit } = await import('@/services/api');
      const result = await searchReddit(`${query} ${phrase}`);
      if (result?.posts?.length) {
        setMorePosts(result.posts);
      } else {
        setMorePosts([]);
      }
    } catch (e) {
      setMorePosts([]);
    } finally {
      setLoadingMore(false);
    }
  };

  const handlePostPress = async (post: RedditPost) => {
    setModalAnimation('fade');
    setSelectedPost(post);
    setModalVisible(true);
    setComments([]);
    setCommentsError(null);
    setCommentsLoading(true);
    try {
      const apiResponse = await fetchRedditComments(post.id);
      let extractedComments: any[] = [];
      if (apiResponse && apiResponse.commentForest && Array.isArray(apiResponse.commentForest.trees)) {
        extractedComments = apiResponse.commentForest.trees
          .filter((tree: any) => tree.node && tree.node.__typename === 'Comment')
          .map((tree: any) => {
            const comment = tree.node;
            // Extract username from various possible fields
            const username = comment.author?.name || 
                           comment.authorName || 
                           comment.username || 
                           comment.author?.displayName ||
                           comment.author?.username ||
                           'Anonymous';
            return {
              ...comment,
              username: username
            };
          });
      }
      setComments(extractedComments);
    } catch (err: any) {
      setCommentsError('Failed to load comments.');
    } finally {
      setCommentsLoading(false);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setTimeout(() => {
      setSelectedPost(null);
      setComments([]);
      setCommentsError(null);
      setCommentsLoading(false);
    }, 300);
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

  const formatDateOnly = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
  };

  const CommentThread = ({ comment, depth = 0 }: { comment: RedditComment; depth?: number }) => {
    const maxDepth = 8;
    
    // Use actual username from comment data, fallback to generated if not available
    const getUsername = (comment: RedditComment) => {
      if (comment.username) {
        return comment.username;
      }
      // Fallback to generated username if no real username is available
      const usernames = ['tegerr', 'yuhandi56_', 'wager33', 'artlover', 'michelangelo_fan', 'renaissance_enthusiast'];
      const index = parseInt(comment.id.slice(-1)) % usernames.length;
      return usernames[index];
    };

    return (
      <View style={styles.commentItem}>
        <View style={styles.commentContent}>
          <View style={styles.commentHeaderRow}>
            <Text style={styles.commentUsername}>{getUsername(comment)}</Text>
            <Text style={styles.commentTime}>• {formatDateOnly(comment.createdAt)}</Text>
          </View>
          <Text style={styles.commentBody}>{comment.content?.markdown || ''}</Text>
          <View style={styles.commentUpvoteRow}>
            <Text style={styles.upvoteArrow}>↑</Text>
            <Text style={styles.commentScore}>{comment.score} points</Text>
          </View>
        </View>
        {comment.replies?.map((reply) => (
          <CommentThread key={reply.id} comment={reply} depth={depth + 1} />
        ))}
      </View>
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.redditBranding}>
            <View style={styles.redditLogo}>
              <Text style={styles.redditLogoText}>R</Text>
            </View>
            <Text style={styles.redditText} numberOfLines={1} ellipsizeMode="tail">Reddit</Text>
          </View>
          <TouchableOpacity 
            style={styles.visitButton}
            onPress={() => Linking.openURL(`https://www.reddit.com/search/?q=${encodeURIComponent(query)}`)}
          >
            <Text style={styles.visitButtonText}>Visit</Text>
            <ExternalLink size={14} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={isDark ? "#FFFFFF" : "#000000"} />
          <Text style={styles.loadingText}>Searching Reddit posts...</Text>
        </View>
      </View>
    );
  }

  // Show error state
  if (!data.success && data.error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.redditBranding}>
            <View style={styles.redditLogo}>
              <Text style={styles.redditLogoText}>R</Text>
            </View>
            <Text style={styles.redditText}>Reddit</Text>
          </View>
          <TouchableOpacity 
            style={styles.visitButton}
            onPress={() => Linking.openURL(`https://www.reddit.com/search/?q=${encodeURIComponent(query)}`)}
          >
            <Text style={styles.visitButtonText}>Visit</Text>
            <ExternalLink size={14} color={isDark ? "#FFFFFF" : "#000000"} strokeWidth={2} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{data.error}</Text>
          {onRetry && (
            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
              <RefreshCw size={16} color={isDark ? "#FFFFFF" : "#000000"} strokeWidth={2} />
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // Don't render if no posts
  if (!data.posts || data.posts.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.redditBranding}>
            <View style={styles.redditLogo}>
              <Text style={styles.redditLogoText}>R</Text>
            </View>
            <Text style={styles.redditText}>Reddit</Text>
          </View>
          <TouchableOpacity 
            style={styles.visitButton}
            onPress={() => Linking.openURL(`https://www.reddit.com/search/?q=${encodeURIComponent(query)}`)}
          >
            <Text style={styles.visitButtonText}>Visit</Text>
            <ExternalLink size={14} color={isDark ? "#FFFFFF" : "#000000"} strokeWidth={2} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No Reddit posts found for this search.</Text>
          {onRetry && (
            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
              <RefreshCw size={16} color={isDark ? "#FFFFFF" : "#000000"} strokeWidth={2} />
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={isDark ? ['#FF45003D', '#0000003D'] : ['#FFF5F0', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}>
      <View style={styles.header}>
        <View style={styles.redditBranding}>
          <Image 
            source={require('@/assets/images/Reddit_Logo.png')} 
            style={styles.redditLogo}
            resizeMode="contain"
          />
          <Text style={styles.redditText}>Reddit</Text>
        </View>
                  <TouchableOpacity 
            style={styles.visitButton}
            onPress={() => Linking.openURL(`https://www.reddit.com/search/?q=${encodeURIComponent(query)}`)}
          >
            <Text style={styles.visitButtonText}>Visit</Text>
            <ExternalLink size={14} color={isDark ? "#FFFFFF" : "#000000"} strokeWidth={2} />
          </TouchableOpacity>
        </View>

      <View style={styles.postsContainer}>
        {data.posts.slice(0, 5).map((post, index) => (
          <TouchableOpacity 
            key={post.id} 
            style={styles.postContainer}
            onPress={() => handlePostPress(post)}
            activeOpacity={0.7}
          >
            <View style={styles.postContent}>
              <View style={styles.postHeader}>
                <View style={styles.postMeta}>
                  <Text style={styles.subreddit}>r/{post.subreddit}</Text>
                  <Text style={styles.time}>{formatDateOnly(post.created)}</Text>
                </View>
              </View>
              
              <Text style={styles.postTitle} numberOfLines={2}>
                {post.title}
              </Text>
              
              <View style={styles.postStats}>
                <View style={styles.statItem}>
                  <ChevronDown size={14} color="#9A9CA9" strokeWidth={1.26} />
                  <Text style={styles.statText}>{formatNumber(post.upvotes)}</Text>
                </View>
                
                <View style={styles.statItem}>
                  <ChevronDown size={14} color="#9A9CA9" strokeWidth={1.26} />
                  <Text style={styles.statText}>{formatNumber(post.comments)}</Text>
                </View>
              </View>
            </View>
            
            {index < data.posts.length - 1 && <View style={styles.divider} />}
          </TouchableOpacity>
        ))}
      </View>

      {enableSuggestions && (
        <View style={{ width: '100%', marginTop: 8, marginBottom: 16 }}>
          {loadingSuggestions ? (
            <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>Navo is loading suggestions...</Text>
          ) : suggestions.length > 0 ? (
            <>
              <Text style={{ fontSize: 13, color: theme.colors.textSecondary, fontFamily: 'Inter-Medium', marginBottom: 8 }}>Suggestions</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 16 }}
                nestedScrollEnabled
                directionalLockEnabled
                keyboardShouldPersistTaps="handled"
                scrollEventThrottle={16}
                bounces={false}
                removeClippedSubviews
              >
                {suggestions.map((s, i) => {
                  const isActive = activeSuggestion === s;
                  const sanitizedSuggestion = s.trim().substring(0, 50); // Truncate long suggestions
                  return (
                    <TouchableOpacity
                      key={`${s}-${i}`}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 16,
                        backgroundColor: isActive
                          ? (isDark ? 'rgba(59,130,246,0.20)' : 'rgba(59,130,246,0.12)')
                          : (isDark ? 'rgba(128,128,128,0.3)' : 'rgba(35,35,35,0.06)'),
                        borderWidth: 0.75,
                        borderColor: isActive ? '#3B82F6' : (isDark ? 'rgba(128,128,128,0.5)' : 'rgba(69,69,69,0.12)'),
                        marginRight: 8,
                        minWidth: 80,
                      }}
                      onPress={() => handleSuggestionPress(s)}
                      activeOpacity={0.85}
                    >
                      <Text 
                        style={{ 
                          fontSize: 12, 
                          color: isDark ? '#FFFFFF' : (isActive ? '#1E3A8A' : theme.colors.text),
                          textAlign: 'center'
                        }}
                        numberOfLines={2}
                      >
                        {sanitizedSuggestion}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          ) : null}
        </View>
      )}

      {enableSuggestions && (loadingMore || morePosts) && (
        <View style={{ width: '100%', marginTop: 12 }}>
          {loadingMore ? (
            <View style={{ paddingVertical: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>Loading more Reddit posts…</Text>
            </View>
          ) : morePosts && morePosts.length > 0 ? (
            <>
              <Text style={{ fontSize: 14, fontFamily: 'Inter-SemiBold', color: theme.colors.text, marginBottom: 8 }}>More like this</Text>
              {morePosts.slice(0, 5).map((post, index) => (
                <TouchableOpacity 
                  key={`more-${post.id}`} 
                  style={styles.postContainer}
                  onPress={() => handlePostPress(post)}
                  activeOpacity={0.7}
                >
                  <View style={styles.postContent}>
                    <View style={styles.postHeader}>
                      <View style={styles.postMeta}>
                        <Text style={styles.subreddit}>r/{post.subreddit}</Text>
                        <Text style={styles.time}>{formatDateOnly(post.created)}</Text>
                      </View>
                    </View>
                    <Text style={styles.postTitle} numberOfLines={2}>{post.title}</Text>
                    <View style={styles.postStats}>
                      <View style={styles.statItem}>
                        <ChevronDown size={14} color="#9A9CA9" strokeWidth={1.26} />
                        <Text style={styles.statText}>{formatNumber(post.upvotes)}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <ChevronDown size={14} color="#9A9CA9" strokeWidth={1.26} />
                        <Text style={styles.statText}>{formatNumber(post.comments)}</Text>
                      </View>
                    </View>
                  </View>
                  {index < morePosts.length - 1 && <View style={styles.divider} />}
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>No additional posts</Text>
          )}
        </View>
      )}

      {/* Modal for full post and comments */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Top Header Bar */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Image 
                  source={require('@/assets/images/Reddit_Logo.png')} 
                  style={styles.modalRedditLogo}
                  resizeMode="contain"
                />
                <Text style={styles.modalSubreddit}>r/{selectedPost?.subreddit}</Text>
                <Text style={styles.modalDate}>• {selectedPost && formatDateOnly(selectedPost.created)}</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closeModal}
              >
                <Text style={styles.modalCloseButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.modalScrollContent}
            >
              {selectedPost && (
                <>
                  <Text style={styles.modalTitle}>{selectedPost.title}</Text>
                  {selectedPost.text || selectedPost.preview ? (
                    <Text style={styles.modalBody}>{selectedPost.text || selectedPost.preview}</Text>
                  ) : null}
                  <View style={styles.modalStats}>
                    <Text style={styles.modalStat}>{formatNumber(selectedPost.upvotes)} upvotes</Text>
                    <Text style={styles.modalStat}>{formatNumber(selectedPost.comments)} comments</Text>
                  </View>
                  {/* Comments section */}
                  <View style={styles.commentsSection}>
                    <Text style={styles.commentsTitle}>Comments</Text>
                    {commentsLoading && <ActivityIndicator size="small" color="#FFFFFF" />}
                    {commentsError && <Text style={styles.commentsPlaceholder}>{commentsError}</Text>}
                    {!commentsLoading && !commentsError && comments.length === 0 && (
                      <Text style={styles.commentsPlaceholder}>No comments found.</Text>
                    )}
                    {!commentsLoading && !commentsError && comments.length > 0 && (
                      comments.map((comment) => (
                        <CommentThread key={comment.id} comment={comment} />
                      ))
                    )}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      </LinearGradient>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 24,
    paddingHorizontal: 8,
    gap: 24,
    width: '100%',
    maxWidth: 374,
    minHeight: 500,
    borderRadius: 48,
    backgroundColor: 'transparent',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    paddingHorizontal: 8,
    gap: 176,
    width: '100%',
    maxWidth: 358,
    height: 32,
  },
  redditBranding: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    gap: 9,
    width: 85,
    height: 22,
  },
  redditLogo: {
    width: 20,
    height: 20,
  },
  redditLogoText: {
    color: isDark ? '#FFFFFF' : '#000000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  redditText: {
    width: 61,
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    color: isDark ? '#FFFFFF' : '#000000',
  },
  visitButton: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
    gap: 8,
    width: 75,
    height: 30,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    borderWidth: 0.56,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
    borderRadius: 20,
    marginRight: 25,
  },
  visitButtonText: {
    width: 33,
    height: 18,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 13,
    lineHeight: 18,
    color: isDark ? '#FFFFFF' : '#000000',
  },
  postsContainer: {
    width: '100%',
    marginBottom: 16,
  },
  postContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    padding: 0,
    gap: 8,
    width: '100%',
    maxWidth: 358,
    marginBottom: 8,
  },
  postContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 12,
    width: '100%',
    maxWidth: 358,
  },
  postHeader: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    gap: 11,
    width: 210,
    height: 24,
  },
  postMeta: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    gap: 5,
  },
  subreddit: {
    width: 165,
    height: 24,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 13,
    lineHeight: 24,
    color: isDark ? '#FFFFFF' : '#000000',
    marginLeft: 40,
  },
  time: {
    width: 80,
    height: 18,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 18,
    color: isDark ? '#9A9CA9' : '#6B7280',
  },
  postTitle: {
    width: '100%',
    maxWidth: 358,
    height: 32,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 19,
    color: isDark ? '#FFFFFF' : '#000000',
  },
  postStats: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 14,
    width: 104,
    height: 15,
  },
  statItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 0,
    gap: 4,
    width: 48,
    height: 15,
  },
  statText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 15,
    color: isDark ? '#9A9CA9' : '#6B7280',
  },
  divider: {
    width: '100%',
    maxWidth: 358,
    height: 0,
    borderWidth: 0.5,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
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
    color: isDark ? '#FFFFFF' : '#000000',
    marginLeft: 8,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: isDark ? '#FFFFFF' : '#000000',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: isDark ? '#FFFFFF' : '#000000',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    paddingTop: 12,
    width: '90%',
    height: '80%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalRedditLogo: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  modalSubreddit: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  modalDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9A9CA9',
    lineHeight: 16,
  },
  modalBody: {
    fontSize: 17,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  modalStats: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  modalStat: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#9A9CA9',
    marginRight: 16,
  },
  commentsSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: 12,
  },
  commentsTitle: {
    fontSize: 17,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  commentsPlaceholder: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#9A9CA9',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalLinkButton: {
    padding: 4,
  },
  modalCloseButton: {
    padding: 4,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalCloseButtonText: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  commentItem: {
    marginBottom: 20,
    position: 'relative',
  },
  commentContent: {
    padding: 0,
  },
  indentLine: {
    position: 'absolute',
    width: 2,
    top: 0,
    bottom: 0,
    opacity: 0.3,
  },
  commentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    minHeight: 16,
  },
  commentUsername: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginRight: 8,
    lineHeight: 16,
    fontWeight: '600',
  },
  commentScore: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9A9CA9',
    lineHeight: 16,
  },
  commentTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9A9CA9',
    lineHeight: 16,
    flexShrink: 0,
  },
  commentUpvoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  upvoteArrow: {
    fontSize: 12,
    color: '#9A9CA9',
    marginRight: 4,
  },
  commentBody: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  viewMoreCommentsButton: {
    backgroundColor: '#FF4500',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 16,
    alignItems: 'center',
  },
  viewMoreCommentsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewMoreCommentsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
  },
});