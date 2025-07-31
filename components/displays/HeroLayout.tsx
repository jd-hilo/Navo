import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  Pressable,
  Linking,
} from 'react-native';
import { 
  ExternalLink, 
  Play, 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark,
  Sparkles,
  Zap,
  TrendingUp,
  Star
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

interface HeroLayoutProps {
  data: any;
  type: 'perplexity_sonar' | 'tiktok' | 'reddit' | 'pinterest';
  query: string;
  onRetry?: () => void;
}

export default function HeroLayout({ data, type, query, onRetry }: HeroLayoutProps) {
  const { theme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const styles = createStyles(theme);

  const getTypeIcon = () => {
    switch (type) {
      case 'perplexity_sonar': return <Sparkles size={24} color="#fff" />;
      case 'tiktok': return <Play size={24} color="#fff" />;
      case 'reddit': return <MessageCircle size={24} color="#fff" />;
      case 'pinterest': return <Heart size={24} color="#fff" />;
      default: return <Star size={24} color="#fff" />;
    }
  };

  const getTypeGradient = () => {
    switch (type) {
      case 'perplexity_sonar': return theme.gradients.gemini;
      case 'tiktok': return theme.gradients.tiktok;
      case 'reddit': return theme.gradients.reddit;
      case 'pinterest': return theme.gradients.pinterest;
      default: return theme.gradients.gemini; // Fallback to gemini gradient
    }
  };

  const getTypeTitle = () => {
    switch (type) {
      case 'perplexity_sonar': return 'AI Answer';
      case 'tiktok': return 'Featured Video';
      case 'reddit': return 'Top Discussion';
      case 'pinterest': return 'Featured Pin';
      default: return 'Featured Content';
    }
  };

  const renderGeminiHero = () => {
    if (!data?.success) return null;
    
    return (
      <TouchableOpacity 
        style={styles.heroCard}
        onPress={() => {
          setSelectedItem(data);
          setModalVisible(true);
        }}>
        <LinearGradient
          colors={getTypeGradient() as unknown as readonly [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}>
          <View style={styles.heroHeader}>
            <View style={styles.heroTitleContainer}>
              {getTypeIcon()}
              <Text style={styles.heroTitle}>{getTypeTitle()}</Text>
              <View style={styles.priorityBadge}>
                <TrendingUp size={12} color="#fff" />
                <Text style={styles.priorityText}>TOP RESULT</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.heroContent}>
            <Text style={styles.heroText} numberOfLines={6}>
              {data.response}
            </Text>
            
            {data.hasWebSearch && (
              <View style={styles.webSearchIndicator}>
                <Zap size={12} color="#fff" />
                <Text style={styles.webSearchText}>Web Search Enhanced</Text>
              </View>
            )}
          </View>
          
          <View style={styles.heroFooter}>
            <TouchableOpacity 
              style={styles.heroActionButton}
              onPress={() => {
                setSelectedItem(data);
                setModalVisible(true);
              }}>
              <Text style={styles.heroActionText}>Read Full Answer</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderTikTokHero = () => {
    if (!data?.success || !data.videos?.[0]) return null;
    
    const video = data.videos[0];
    
    return (
      <TouchableOpacity 
        style={styles.heroCard}
        onPress={() => {
          setSelectedItem(video);
          setModalVisible(true);
        }}>
        <LinearGradient
          colors={getTypeGradient() as unknown as readonly [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}>
          <View style={styles.heroHeader}>
            <View style={styles.heroTitleContainer}>
              {getTypeIcon()}
              <Text style={styles.heroTitle}>{getTypeTitle()}</Text>
              <View style={styles.priorityBadge}>
                <TrendingUp size={12} color="#fff" />
                <Text style={styles.priorityText}>TRENDING</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.videoContainer}>
            <Image source={{ uri: video.thumbnail }} style={styles.videoThumbnail} />
            <View style={styles.videoOverlay}>
              <View style={styles.playButton}>
                <Play size={32} color="#fff" fill="#fff" />
              </View>
            </View>
          </View>
          
          <View style={styles.heroContent}>
            <Text style={styles.heroText} numberOfLines={2}>
              {video.title}
            </Text>
            <Text style={styles.videoAuthor}>@{video.author}</Text>
            <Text style={styles.videoViews}>{video.views} views</Text>
          </View>
          
          <View style={styles.heroFooter}>
            <TouchableOpacity 
              style={styles.heroActionButton}
              onPress={() => Linking.openURL(video.url)}>
              <Text style={styles.heroActionText}>Watch on TikTok</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderRedditHero = () => {
    if (!data?.success || !data.posts?.[0]) return null;
    
    const post = data.posts[0];
    
    return (
      <TouchableOpacity 
        style={styles.heroCard}
        onPress={() => {
          setSelectedItem(post);
          setModalVisible(true);
        }}>
        <LinearGradient
          colors={getTypeGradient() as unknown as readonly [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}>
          <View style={styles.heroHeader}>
            <View style={styles.heroTitleContainer}>
              {getTypeIcon()}
              <Text style={styles.heroTitle}>{getTypeTitle()}</Text>
              <View style={styles.priorityBadge}>
                <TrendingUp size={12} color="#fff" />
                <Text style={styles.priorityText}>HOT</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.heroContent}>
            <Text style={styles.heroText} numberOfLines={4}>
              {post.title}
            </Text>
            <Text style={styles.redditSubreddit}>r/{post.subreddit}</Text>
            <Text style={styles.redditStats}>
              {post.upvotes} upvotes • {post.comments} comments
            </Text>
          </View>
          
          <View style={styles.heroFooter}>
            <TouchableOpacity 
              style={styles.heroActionButton}
              onPress={() => Linking.openURL(post.url)}>
              <Text style={styles.heroActionText}>View on Reddit</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderPinterestHero = () => {
    if (!data?.success || !data.pins?.[0]) return null;
    
    const pin = data.pins[0];
    
    return (
      <TouchableOpacity 
        style={styles.heroCard}
        onPress={() => {
          setSelectedItem(pin);
          setModalVisible(true);
        }}>
        <LinearGradient
          colors={getTypeGradient() as unknown as readonly [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}>
          <View style={styles.heroHeader}>
            <View style={styles.heroTitleContainer}>
              {getTypeIcon()}
              <Text style={styles.heroTitle}>{getTypeTitle()}</Text>
              <View style={styles.priorityBadge}>
                <TrendingUp size={12} color="#fff" />
                <Text style={styles.priorityText}>FEATURED</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.pinContainer}>
            <Image source={{ uri: pin.image_url }} style={styles.pinImage} />
          </View>
          
          <View style={styles.heroContent}>
            <Text style={styles.heroText} numberOfLines={2}>
              {pin.title}
            </Text>
            {pin.user_name && (
              <Text style={styles.pinterestUser}>@{pin.user_name}</Text>
            )}
            <Text style={styles.pinterestStats}>
              {pin.likes} likes • {pin.saves} saves
            </Text>
          </View>
          
          <View style={styles.heroFooter}>
            <TouchableOpacity 
              style={styles.heroActionButton}
              onPress={() => Linking.openURL(pin.link)}>
              <Text style={styles.heroActionText}>View on Pinterest</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderHeroContent = () => {
    switch (type) {
      case 'perplexity_sonar': return renderGeminiHero();
      case 'tiktok': return renderTikTokHero();
      case 'reddit': return renderRedditHero();
      case 'pinterest': return renderPinterestHero();
      default: return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderHeroContent()}
      
      {/* Modal for detailed view */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {type.toUpperCase()} - {getTypeTitle()}
                </Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalCloseText}>×</Text>
                </TouchableOpacity>
              </View>
              
              {selectedItem && (
                <View style={styles.modalBody}>
                  {type === 'perplexity_sonar' && (
                    <Text style={styles.modalText}>{selectedItem.response}</Text>
                  )}
                  {type === 'tiktok' && (
                    <View>
                      <Image source={{ uri: selectedItem.thumbnail }} style={styles.modalImage} />
                      <Text style={styles.modalText}>{selectedItem.title}</Text>
                      <Text style={styles.modalSubtext}>@{selectedItem.author} • {selectedItem.views}</Text>
                    </View>
                  )}
                  {type === 'reddit' && (
                    <View>
                      <Text style={styles.modalText}>{selectedItem.title}</Text>
                      <Text style={styles.modalSubtext}>r/{selectedItem.subreddit} • {selectedItem.upvotes} upvotes</Text>
                    </View>
                  )}
                  {type === 'pinterest' && (
                    <View>
                      <Image source={{ uri: selectedItem.image_url }} style={styles.modalImage} />
                      <Text style={styles.modalText}>{selectedItem.title}</Text>
                      <Text style={styles.modalSubtext}>@{selectedItem.user_name} • {selectedItem.likes} likes</Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalActionButton}
                onPress={() => {
                  if (selectedItem?.url || selectedItem?.link) {
                    Linking.openURL(selectedItem.url || selectedItem.link);
                  }
                  setModalVisible(false);
                }}>
                <ExternalLink size={16} color="#fff" />
                <Text style={styles.modalActionText}>Open Original</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    marginHorizontal: 16,
  },
  heroCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  heroGradient: {
    padding: 20,
  },
  heroHeader: {
    marginBottom: 16,
  },
  heroTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginLeft: 8,
    flex: 1,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginLeft: 4,
  },
  heroContent: {
    marginBottom: 16,
  },
  heroText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#fff',
    lineHeight: 24,
  },
  webSearchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  webSearchText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#fff',
    marginLeft: 4,
    opacity: 0.9,
  },
  videoContainer: {
    position: 'relative',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  videoThumbnail: {
    width: '100%',
    height: 200,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 40,
    padding: 16,
  },
  videoAuthor: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#fff',
    marginTop: 8,
  },
  videoViews: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#fff',
    opacity: 0.8,
  },
  redditSubreddit: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#fff',
    marginTop: 8,
  },
  redditStats: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
  },
  pinContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  pinImage: {
    width: '100%',
    height: 200,
  },
  pinterestUser: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#fff',
    marginTop: 8,
  },
  pinterestStats: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
  },
  heroFooter: {
    alignItems: 'center',
  },
  heroActionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  heroActionText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: theme.colors.textSecondary,
  },
  modalBody: {
    padding: 20,
  },
  modalText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text,
    lineHeight: 24,
  },
  modalSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginTop: 8,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalActionText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
    marginLeft: 8,
  },
}); 