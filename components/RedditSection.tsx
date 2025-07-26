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
} from 'react-native';
import { MessageCircle, ArrowUp, Award, ExternalLink, RefreshCw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { fetchRedditComments } from '@/services/api';

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
}

export default function RedditSection({ data, query, onRetry, isLoading }: RedditSectionProps) {
  const { theme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<RedditPost | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [modalAnimation, setModalAnimation] = useState<'fade' | 'none'>('fade');

  const handlePostPress = async (post: RedditPost) => {
    setModalAnimation('fade');
    setSelectedPost(post);
    setModalVisible(true);
    setComments([]);
    setCommentsError(null);
    setCommentsLoading(true);
    try {
      // post.id is like 't3_178zwq0'
      const apiResponse = await fetchRedditComments(post.id);
      // Extract comments from commentForest.trees[].node
      let extractedComments: any[] = [];
      if (apiResponse && apiResponse.commentForest && Array.isArray(apiResponse.commentForest.trees)) {
        extractedComments = apiResponse.commentForest.trees
          .filter((tree: any) => tree.node && tree.node.__typename === 'Comment')
          .map((tree: any) => tree.node);
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
    // Delay the cleanup until after the fade animation
    setTimeout(() => {
      setSelectedPost(null);
      setComments([]);
      setCommentsError(null);
      setCommentsLoading(false);
    }, 300); // 300ms matches the default Modal fade duration
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
    if (isNaN(date.getTime())) return dateString; // fallback to raw string if invalid
    return date.toLocaleDateString();
  };

  const styles = createStyles(theme);

  const CommentThread = ({ comment, depth = 0 }: { comment: RedditComment; depth?: number }) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const maxDepth = 8; // Maximum nesting level before we stop showing indent lines
    
    const renderIndentLines = () => {
      return Array.from({ length: Math.min(depth, maxDepth) }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.indentLine,
            {
              left: index * 16,
              backgroundColor: theme.colors.border,
            }
          ]}
        />
      ));
    };

    return (
      <View style={[styles.commentItem, { marginLeft: Math.min(depth, maxDepth) * 16 }]}>
        {depth > 0 && renderIndentLines()}
        <View style={styles.commentContent}>
          <View style={styles.commentHeaderRow}>
            <Text style={styles.commentScore}>{comment.score} points</Text>
            <Text style={styles.commentTime}>• {formatDateOnly(comment.createdAt)}</Text>
          </View>
          <Text style={styles.commentBody}>{comment.content?.markdown || ''}</Text>
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
      <LinearGradient
        colors={theme.gradients.reddit as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
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
        colors={theme.gradients.reddit as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
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
        colors={theme.gradients.reddit as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
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
      colors={theme.gradients.reddit as unknown as readonly [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBorder}>
      <View style={styles.container}>
        <View style={styles.header}>
                      <View style={styles.titleContainer}>
            
            {!data.success && (
              <View style={styles.fallbackIndicator}>
                <Text style={styles.fallbackText}>Sample</Text>
              </View>
            )}
          </View>

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
              onPress={() => handlePostPress(post)}>
              <View style={styles.postHeader}>
                <Text style={styles.subreddit}>r/{post.subreddit}</Text>
                <Text style={styles.time}>{formatDateOnly(post.created)}</Text>
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
        {/* Modal for full post and comments */}
        <Modal
          visible={modalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={closeModal}
        >
          <Pressable style={styles.modalOverlay} onPress={closeModal}>
            <Pressable 
              style={styles.modalContent} 
              onPress={(e) => e.stopPropagation()}>
              <ScrollView>
                <View style={styles.modalHeaderRow}>
                  <TouchableOpacity
                    style={styles.modalLinkButton}
                    onPress={() => selectedPost && Linking.openURL(selectedPost.url)}
                    accessibilityLabel="Open in Reddit"
                  >
                    <ExternalLink size={22} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                {selectedPost && (
                  <>
                    <Text style={styles.modalSubreddit}>r/{selectedPost.subreddit}</Text>
                    <Text style={styles.modalTitle}>{selectedPost.title}</Text>
                    <Text style={styles.modalDate}>{formatDateOnly(selectedPost.created)}</Text>
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
                      {commentsLoading && <ActivityIndicator size="small" color={theme.colors.textSecondary} />}
                      {commentsError && <Text style={styles.commentsPlaceholder}>{commentsError}</Text>}
                      {!commentsLoading && !commentsError && comments.length === 0 && (
                        <Text style={styles.commentsPlaceholder}>No comments found.</Text>
                      )}
                      {!commentsLoading && !commentsError && comments.length > 0 && (
                        comments.slice(0, 10).map((comment) => (
                          <CommentThread key={comment.id} comment={comment} />
                        ))
                      )}
                    </View>
                  </>
                )}
              </ScrollView>
              <Pressable 
                style={styles.closeButton} 
                onPress={closeModal}
                android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}>
                <Text style={styles.closeButtonText}>Close</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </LinearGradient>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  gradientBorder: {
    borderRadius: 14,
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
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    lineHeight: 22,
    marginBottom: 6,
  },
  postPreview: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    lineHeight: 22,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalSubreddit: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  modalDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  modalBody: {
    fontSize: 17,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text,
    marginBottom: 16,
  },
  modalStats: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  modalStat: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginRight: 16,
  },
  commentsSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
  },
  commentsTitle: {
    fontSize: 17,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  commentsPlaceholder: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
  },
  closeButton: {
    marginTop: 16,
    alignSelf: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 32,
  },
  closeButtonText: {
    color: theme.colors.background,
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  commentItem: {
    marginBottom: 16,
    position: 'relative',
  },
  commentContent: {
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  commentAuthor: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: '#0079d3', // Reddit blue
    marginRight: 8,
  },
  commentScore: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginRight: 8,
  },
  commentTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
  },
  commentBody: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text,
    lineHeight: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  modalLinkButton: {
    marginRight: 8,
    padding: 4,
  },
});