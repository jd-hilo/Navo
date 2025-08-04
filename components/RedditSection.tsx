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
      const apiResponse = await fetchRedditComments(post.id);
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

  const styles = createStyles(theme);

  const CommentThread = ({ comment, depth = 0 }: { comment: RedditComment; depth?: number }) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const maxDepth = 8;
    
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
            <ExternalLink size={14} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#FFFFFF" />
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
            <ExternalLink size={14} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{data.error}</Text>
          {onRetry && (
            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
              <RefreshCw size={16} color="#FFFFFF" strokeWidth={2} />
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
            <ExternalLink size={14} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No Reddit posts found for this search.</Text>
          {onRetry && (
            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
              <RefreshCw size={16} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#FF45003D', '#0000003D']}
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
            <ExternalLink size={14} color="#FFFFFF" strokeWidth={2} />
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

      {/* Modal for full post and comments */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <TouchableOpacity
                style={styles.modalLinkButton}
                onPress={() => selectedPost && Linking.openURL(selectedPost.url)}
                accessibilityLabel="Open in Reddit"
              >
                <ExternalLink size={22} color="#FFFFFF" />
              </TouchableOpacity>
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
                    {commentsLoading && <ActivityIndicator size="small" color="#FFFFFF" />}
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
          </View>
        </View>
      </Modal>
      </LinearGradient>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 24,
    paddingHorizontal: 8,
    gap: 24,
    width: 374,
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
    width: 358,
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
    color: '#FFFFFF',
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
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 0.56,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    marginRight: 15,
  },
  visitButtonText: {
    width: 33,
    height: 18,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 13,
    lineHeight: 18,
    color: '#FFFFFF',
  },
  postsContainer: {
    flex: 1,
    width: '100%',
  },
  postContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    padding: 0,
    gap: 8,
    width: 358,
    marginBottom: 8,
  },
  postContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 12,
    width: 358,
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
    color: '#FFFFFF',
    marginLeft:35,
  },
  time: {
    width: 80,
    height: 18,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 18,
    color: '#9A9CA9',
  },
  postTitle: {
    width: 358,
    height: 32,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 19,
    color: '#FFFFFF',
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
    color: '#9A9CA9',
  },
  divider: {
    width: 358,
    height: 0,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
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
    color: '#FFFFFF',
    marginLeft: 8,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
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
    padding: 24,
    width: '90%',
    height: '80%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalSubreddit: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#9A9CA9',
    marginBottom: 4,
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
    marginBottom: 12,
    lineHeight: 16,
    minHeight: 16,
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
    marginBottom: 16,
    position: 'relative',
  },
  commentContent: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
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
    minHeight: 16,
  },
  commentScore: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9A9CA9',
    marginRight: 8,
    lineHeight: 16,
  },
  commentTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9A9CA9',
    lineHeight: 16,
    flexShrink: 0,
  },
  commentBody: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    lineHeight: 20,
  },
});