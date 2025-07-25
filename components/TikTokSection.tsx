import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Dimensions,
  Modal,
  Pressable,
  ActivityIndicator,
  ViewStyle,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Video, ExternalLink, Play, RefreshCw, X, Heart, MessageCircle, Share2, Music, Volume2, VolumeX, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { Video as ExpoVideo, ResizeMode } from 'expo-av';
import { WebView } from 'react-native-webview';
import { getTikTokVideoDetails } from '@/services/api';

interface TikTokVideo {
  id: string;
  title: string;
  thumbnail: string;
  author: string;
  views: string;
  url: string;
}

interface TikTokSectionProps {
  data: {
    videos: TikTokVideo[];
    success: boolean;
    error?: string;
  };
  query: string;
  onRetry?: () => void;
}

const extractTikTokVideoId = (url: string): string | null => {
  try {
    const parts = url.split('/video/');
    if (parts.length > 1) {
      return parts[1].split('?')[0]; // Remove query string
    }
    return null;
  } catch {
    return null;
  }
};

function TikTokVideoModal({ 
  video, 
  isVisible, 
  onClose,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext
}: { 
  video: TikTokVideo; 
  isVisible: boolean; 
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}) {
  const { theme } = useTheme();
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isLoadingVideo, setIsLoadingVideo] = useState(true);
  const [videoError, setVideoError] = useState<string>('');
  const videoRef = useRef<any>(null);

  useEffect(() => {
    if (isVisible && video.url) {
      setIsLoadingVideo(true);
      const videoId = extractTikTokVideoId(video.url);
      if (videoId) {
        const embedUrl = `https://www.tiktok.com/player/v1/${videoId}?autoplay=1&loop=1&mute=0&controls=1`;
        setVideoUrl(embedUrl);
        setVideoError('');
      } else {
        setVideoUrl('');
        setVideoError('Invalid TikTok URL format');
      }
      setIsLoadingVideo(false);
    }
  }, [isVisible, video.url]);

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  const handleShare = () => {
    Linking.openURL(video.url);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  const handleOpenInBrowser = () => {
    Linking.openURL(video.url);
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar hidden />
      <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
        <View style={{ flex: 1 }}>
          {isLoadingVideo ? (
            <View style={{ 
              flex: 1, 
              justifyContent: 'center', 
              alignItems: 'center', 
              backgroundColor: '#000000' 
            }}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={{ 
                color: '#FFFFFF', 
                marginTop: 16, 
                fontSize: 16, 
                fontFamily: 'Inter-Medium' 
              }}>
                Loading TikTok video...
              </Text>
              {videoError && (
                <Text style={{ 
                  color: '#FF6B6B', 
                  marginTop: 8, 
                  fontSize: 14, 
                  fontFamily: 'Inter-Regular',
                  textAlign: 'center',
                  paddingHorizontal: 20
                }}>
                  {videoError}
                </Text>
              )}
            </View>
          ) : videoError ? (
            // Fallback when video URL is not available - show error
            <View style={{ 
              flex: 1, 
              justifyContent: 'center', 
              alignItems: 'center', 
              backgroundColor: '#000000' 
            }}>
              <Image 
                source={{ uri: video.thumbnail || 'https://via.placeholder.com/400x600/000000/FFFFFF?text=TikTok' }} 
                style={{ 
                  width: '80%', 
                  height: '60%', 
                  borderRadius: 12,
                  marginBottom: 20
                }}
                resizeMode="cover"
              />
              <Text style={{ 
                color: '#FFFFFF', 
                fontSize: 18, 
                fontFamily: 'Inter-SemiBold',
                textAlign: 'center',
                marginBottom: 8
              }}>
                Video Preview
              </Text>
              <Text style={{ 
                color: '#CCCCCC', 
                fontSize: 14, 
                fontFamily: 'Inter-Regular',
                textAlign: 'center',
                paddingHorizontal: 40,
                lineHeight: 20
              }}>
                Tap "Open in TikTok" to watch the full video
              </Text>
            </View>
          ) : videoUrl ? (
            <View style={{ 
              flex: 1, 
              justifyContent: 'center', 
              alignItems: 'center',
              backgroundColor: '#000000'
            }}>
              {/* Top Controls */}
              <View style={{ 
                position: 'absolute',
                top: -10,
                left: 0,
                right: 0,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 16,
                zIndex: 2
              }}>
                <TouchableOpacity 
                  onPress={onClose} 
                  style={{ 
                    padding: 8,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    borderRadius: 20
                  }}
                >
                  <X size={24} color="#FFFFFF" strokeWidth={2} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={handleOpenInBrowser}
                  style={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontFamily: 'Inter-Medium' }}>
                    Open in TikTok
                  </Text>
                  <ExternalLink size={16} color="#FFFFFF" strokeWidth={2} />
                </TouchableOpacity>
              </View>

              {/* Video Player */}
              <View style={{ 
                width: '85%', 
                aspectRatio: 9/16, 
                borderRadius: 12, 
                overflow: 'hidden',
                backgroundColor: '#000000',
                marginTop: -20
              }}>
                <WebView
                  source={{ uri: videoUrl }}
                  style={{ flex: 1 }}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  allowsInlineMediaPlayback={true}
                  mediaPlaybackRequiresUserAction={false}
                  useWebKit={true}
                  scrollEnabled={false}
                  startInLoadingState
                  renderLoading={() => (
                    <View style={{ 
                      flex: 1, 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      backgroundColor: '#000000'
                    }}>
                      <ActivityIndicator size="large" color="#FFFFFF" />
                    </View>
                  )}
                  onLoad={() => console.log('✅ TikTok embed loaded')}
                  onError={(e) => {
                    console.log('❌ TikTok embed error', e);
                    setVideoError('Failed to load video');
                  }}
                />
              </View>

              {/* Bottom Navigation Controls */}
              <View style={{
                position: 'absolute',
                bottom: 28,
                left: 0,
                right: 0,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 20,
                paddingHorizontal: 16
              }}>
                {hasPrevious && onPrevious && (
                  <TouchableOpacity 
                    onPress={onPrevious}
                    style={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      padding: 12,
                      borderRadius: 25,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    <ChevronLeft size={24} color="#FFFFFF" strokeWidth={2} />
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontFamily: 'Inter-Medium' }}>
                      Previous
                    </Text>
                  </TouchableOpacity>
                )}

                {hasNext && onNext && (
                  <TouchableOpacity 
                    onPress={onNext}
                    style={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      padding: 12,
                      borderRadius: 25,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontFamily: 'Inter-Medium' }}>
                      Next
                    </Text>
                    <ChevronRight size={24} color="#FFFFFF" strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function TikTokVideoCard({ 
  video, 
  onPress 
}: { 
  video: TikTokVideo; 
  onPress: () => void; 
}) {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity 
      style={{ 
        width: 320, 
        height: 400, 
        borderRadius: 12, 
        overflow: 'hidden', 
        backgroundColor: theme.colors.card 
      }} 
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={{ flex: 1, position: 'relative' }}>
        <Image 
          source={{ uri: video.thumbnail || 'https://via.placeholder.com/320x400/000000/FFFFFF?text=TikTok' }} 
          style={{ flex: 1 }}
          resizeMode="cover"
        />
        <View style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          justifyContent: 'center', 
          alignItems: 'center' 
        }}>
          <Play size={24} color="#FFFFFF" fill="#FFFFFF" strokeWidth={2} />
        </View>
      </View>
      
      <View style={{ padding: 12 }}>
        <Text style={{ 
          fontSize: 14, 
          fontFamily: 'Inter-Medium', 
          color: theme.colors.text, 
          lineHeight: 18, 
          marginBottom: 4 
        }} numberOfLines={2}>
          {video.title}
        </Text>
        <Text style={{ 
          fontSize: 12, 
          fontFamily: 'Inter-Regular', 
          color: theme.colors.textSecondary, 
          marginBottom: 2 
        }} numberOfLines={1}>
          @{video.author}
        </Text>
        <Text style={{ 
          fontSize: 12, 
          fontFamily: 'Inter-Regular', 
          color: theme.colors.textSecondary 
        }}>
          {video.views} views
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function TikTokSection({ data, query, onRetry }: TikTokSectionProps) {
  const { theme } = useTheme();
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number>(-1);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const styles = createStyles(theme);

  const handleVideoPress = (video: TikTokVideo, index: number) => {
    setSelectedVideoIndex(index);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedVideoIndex(-1);
    // Reload the TikTok section when modal is closed
    setReloadKey(prev => prev + 1);
    // Optionally trigger a retry to refresh the data
    if (onRetry) {
      setTimeout(() => {
        onRetry();
      }, 100);
    }
  };

  const handlePreviousVideo = () => {
    if (selectedVideoIndex > 0) {
      setSelectedVideoIndex(selectedVideoIndex - 1);
    }
  };

  const handleNextVideo = () => {
    if (selectedVideoIndex < data.videos.length - 1) {
      setSelectedVideoIndex(selectedVideoIndex + 1);
    }
  };

  if (!data.success && data.error) {
    return (
      <LinearGradient
        colors={theme.gradients.tiktok as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
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

  if (!data.videos || data.videos.length === 0) {
    return null;
  }

  return (
    <>
    <LinearGradient
        key={reloadKey}
      colors={theme.gradients.tiktok as unknown as readonly [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradientBorder, { flex: 1 }]}
    >
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

          {/* TikTok video cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.videosContainer}>
          {data.videos.map((video, idx) => (
            <View 
                key={`${video.id}-${reloadKey}`}
              style={[
                  styles.videoCardWrapper, 
                idx === 0 && styles.firstVideo,
                idx === data.videos.length - 1 && { marginRight: 20 }
              ]}
            >
                <TikTokVideoCard 
                  video={video} 
                  onPress={() => handleVideoPress(video, idx)}
                />
            </View>
          ))}
        </ScrollView>
        <View style={{ alignItems: 'center', marginTop: 6, marginBottom: 2 }}>
            <Text style={{ fontSize: 13, color: theme.colors.textSecondary, fontFamily: 'Inter-Medium' }}>swipe for more →</Text>
        </View>
      </View>
    </LinearGradient>

      {/* Video Modal */}
      {selectedVideoIndex !== -1 && data.videos[selectedVideoIndex] && (
        <TikTokVideoModal
          video={data.videos[selectedVideoIndex]}
          isVisible={isModalVisible}
          onClose={handleCloseModal}
          onPrevious={handlePreviousVideo}
          onNext={handleNextVideo}
          hasPrevious={selectedVideoIndex > 0}
          hasNext={selectedVideoIndex < data.videos.length - 1}
        />
      )}
    </>
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
  actionButton: {
    padding: 8,
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
  videoInfo: {
    padding: 12,
  },
  videoTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: theme.colors.text,
    lineHeight: 18,
    marginBottom: 4,
  },
  videoAuthor: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  videoViews: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  videoContainer: {
    flex: 1,
  },
  video: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  closeButton: {
    padding: 8,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  bottomInfo: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  authorText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  captionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  musicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  musicText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  followButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 4,
  },
  followText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  playOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
    borderRadius: 20,
  },
  thumbnailContainer: {
    flex: 1,
    position: 'relative',
  },
  thumbnail: {
    flex: 1,
  },
  playIconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});