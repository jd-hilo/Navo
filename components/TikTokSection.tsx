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
import { getTikTokVideoDetails, extractContentData } from '@/services/api';
import { SaveButton } from './SaveButton';

// In-memory cache for AI suggestions per query
const tiktokSuggestionCache: Record<string, string[]> = {};

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
  enableSuggestions?: boolean;
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
  videos,
  initialIndex = 0,
  isVisible, 
  onClose,
}: { 
  videos: TikTokVideo[];
  initialIndex?: number;
  isVisible: boolean; 
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState<number>(Math.max(0, Math.min(initialIndex, videos.length - 1)));
  const listRef = useRef<any>(null);
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    setCurrentIndex(Math.max(0, Math.min(initialIndex, videos.length - 1)));
  }, [initialIndex, videos.length]);

  const handleOpenInBrowser = () => {
    const current = videos[currentIndex];
    if (current?.url) {
      Linking.openURL(current.url);
    }
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
              {/* Swipeable Video List */}
              <View style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  contentOffset={{ x: currentIndex * screenWidth, y: 0 }}
                  onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
                    setCurrentIndex(index);
                  }}
                  style={{ flex: 1, width: '100%' }}
                >
                  {videos.map((item, idx) => {
                    const isActive = idx === currentIndex;
                    const videoId = extractTikTokVideoId(item.url);
                    const embedUrl = isActive && videoId ? `https://www.tiktok.com/player/v1/${videoId}?autoplay=1&loop=1&mute=0&controls=1` : '';
                    return (
                      <View key={item.id || String(idx)} style={{ width: screenWidth, alignItems: 'center', justifyContent: 'center' }}>
                        <View style={{ 
                          width: '85%', 
                          aspectRatio: 9/16, 
                          borderRadius: 12, 
                          overflow: 'hidden',
                          backgroundColor: '#000000',
                          marginTop: -20
                        }}>
                          {embedUrl ? (
                            <WebView
                              source={{ uri: embedUrl }}
                              style={{ flex: 1 }}
                              javaScriptEnabled={true}
                              domStorageEnabled={true}
                              allowsInlineMediaPlayback={true}
                              mediaPlaybackRequiresUserAction={false}
                              useWebKit={true}
                              scrollEnabled={false}
                              startInLoadingState
                              renderLoading={() => (
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' }}>
                                  <ActivityIndicator size="large" color="#FFFFFF" />
                                </View>
                              )}
                            />
                          ) : (
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' }}>
                              <Image 
                                source={{ 
                                  uri: item.thumbnail || 'https://via.placeholder.com/400x600/000000/FFFFFF?text=TikTok',
                                  cache: 'force-cache'
                                }} 
                                style={{ width: '100%', height: '100%' }}
                                resizeMode="cover"
                              />
                              <Text style={{ position: 'absolute', color: '#FFFFFF', bottom: 16, fontFamily: 'Inter-Medium' }}>Open in TikTok to watch</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Bottom hint */}
              <View style={{ position: 'absolute', bottom: 18, left: 0, right: 0, alignItems: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, fontFamily: 'Inter-Medium' }}>Swipe → next   •   Swipe ← previous</Text>
              </View>
            </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function TikTokVideoCard({ 
  video, 
  onPress,
  cardWidth = 320,
  cardHeight = 400,
}: { 
  video: TikTokVideo; 
  onPress: () => void; 
  cardWidth?: number;
  cardHeight?: number;
}) {
  const { theme } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const videoRef = useRef<any>(null);
  
  // Auto-play when component mounts
  useEffect(() => {
    const loadVideo = async () => {
      setIsLoadingVideo(true);
      try {
        const videoId = extractTikTokVideoId(video.url);
        if (videoId) {
          // Use a direct video URL or embed URL that can auto-play
          const embedUrl = `https://www.tiktok.com/player/v1/${videoId}?autoplay=1&loop=1&mute=1&controls=0`;
          setVideoUrl(embedUrl);
          setIsPlaying(true);
        }
      } catch (error) {
        console.error('Error loading TikTok video:', error);
      } finally {
        setIsLoadingVideo(false);
      }
    };
    
    // Start playing after a short delay
    const timer = setTimeout(() => {
      loadVideo();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [video.url]);
  
  return (
    <TouchableOpacity 
      style={{ 
        width: cardWidth, 
        height: cardHeight, 
        borderRadius: 24, 
        overflow: 'hidden', 
        backgroundColor: 'transparent'
      }} 
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={{ flex: 1, position: 'relative' }}>
        {/* Always show thumbnail as background */}
        <Image 
          source={{ 
            uri: video.thumbnail || 'https://via.placeholder.com/320x500/000000/FFFFFF?text=TikTok',
            cache: 'force-cache'
          }} 
          style={{ flex: 1 }}
          resizeMode="cover"
        />
        
        {/* Loading overlay */}
        {isLoadingVideo && (
          <View style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center', 
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.3)',
            pointerEvents: 'none' // Allow scroll events to pass through
          }}>
            <ActivityIndicator size="small" color="#FFFFFF" />
          </View>
        )}
        
        {/* Video overlay when loaded */}
        {videoUrl && (
          <View style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}>
            <WebView
              source={{ uri: videoUrl }}
              style={{ flex: 1 }}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              scrollEnabled={false}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              onError={() => {
                // Fallback to thumbnail if video fails to load
                setVideoUrl('');
              }}
            />
          </View>
        )}
        
        {!videoUrl && (
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
        )}

        {/* Save Button - Top Right */}
        <View style={{ 
          position: 'absolute',
          top: 12,
          right: 12,
        }}>
          <SaveButton
            contentType="tiktok"
            contentData={extractContentData('tiktok', video)}
            title={video.title}
            description={`TikTok video by @${video.author}`}
            sourceUrl={video.url}
            thumbnailUrl={video.thumbnail}
            size="small"
            variant="icon"
          />
        </View>

        {/* Video Overlay - Bottom Section */}
        <View style={{ 
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 8,
          paddingBottom: 8,
        }}>
          {/* Content Details */}
          <View style={{ 
            paddingHorizontal: 8,
            gap: 10,
          }}>
            {/* Username */}
            <Text style={{ 
              width: 102,
              height: 17,
              fontFamily: 'Inter',
              fontStyle: 'normal',
              fontWeight: '700',
              fontSize: 14,
              lineHeight: 17,
              color: '#FFFFFF',
              marginBottom: 0,
            }}>
              @{video.author}
            </Text>
            
            {/* Caption */}
            <Text style={{ 
              maxWidth: 200,
              height: 36,
              fontFamily: 'Inter',
              fontStyle: 'normal',
              fontWeight: '400',
              fontSize: 14,
              lineHeight: 18,
              color: '#FFFFFF',
              marginBottom: 0,
            }} numberOfLines={2}>
              {video.title}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function TikTokSection({ data, query, onRetry, enableSuggestions = false }: TikTokSectionProps) {
  const { theme, isDark } = useTheme();
  const styles = createStyles(theme, isDark);
  const [selectedVideo, setSelectedVideo] = useState<TikTokVideo | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [extraResults, setExtraResults] = useState<TikTokVideo[] | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState<string | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    let mounted = true;
    const generateSuggestions = async () => {
      if (!enableSuggestions || !query) return;
      // Use cache to avoid re-generating on filter toggles
      if (tiktokSuggestionCache[query]) {
        if (mounted) setSuggestions(tiktokSuggestionCache[query]);
        return;
      }
      try {
        setLoadingSuggestions(true);
        // Use Sonar quick follow-up to produce related TikTok-style search ideas
        const { quickFollowUp } = await import('@/services/sonar');
        const res = await quickFollowUp(`Give 3-5 short TikTok search ideas related to: ${query}. Return as comma-separated phrases only.`);
        const text = (res.response || '').replace(/\n/g, ' ').trim();
        let items: string[] = [];
        if (text.includes(',')) {
          items = text.split(',').map(s => s.trim()).filter(Boolean).slice(0, 5);
        } else {
          items = text.split(/\s*[-•]\s*|\s*\d+\.\s*/).map(s => s.trim()).filter(Boolean).slice(0, 5);
        }
        tiktokSuggestionCache[query] = items;
        if (mounted) setSuggestions(items);
      } catch (e) {
        if (mounted) setSuggestions([]);
      }
      finally {
        if (mounted) setLoadingSuggestions(false);
      }
    };
    generateSuggestions();
    return () => { mounted = false; };
  }, [query]);

  const handleSuggestionPress = async (s: string) => {
    setActiveSuggestion(s);
    setLoadingMore(true);
    try {
      const { searchTikTok } = await import('@/services/api');
      const result = await searchTikTok(`${query} ${s}`);
      if (result?.videos?.length) {
        setExtraResults(result.videos);
      } else {
        setExtraResults([]);
      }
    } catch (e) {
      setExtraResults([]);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleVideoPress = (video: TikTokVideo) => {
    setSelectedVideo(video);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedVideo(null);
    // Reload the TikTok section when modal is closed
    setReloadKey(prev => prev + 1);
    // Optionally trigger a retry to refresh the data
    if (onRetry) {
      setTimeout(() => {
        onRetry();
      }, 100);
    }
  };

  const selectedIndex = selectedVideo ? data.videos.findIndex(v => v.id === selectedVideo.id) : -1;
  const handlePreviousVideo = () => {
    if (selectedIndex > 0) {
      const prev = data.videos[selectedIndex - 1];
      if (prev) setSelectedVideo(prev);
    }
  };

  const handleNextVideo = () => {
    if (selectedIndex !== -1 && selectedIndex < data.videos.length - 1) {
      const next = data.videos[selectedIndex + 1];
      if (next) setSelectedVideo(next);
    }
  };

  if (!data.success && data.error) {
    return (
      <View style={styles.gradientBorder}>
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
      </View>
    );
  }

  if (!data.videos || data.videos.length === 0) {
    return null;
  }

  return (
    <>
    <View
        key={reloadKey}
      style={[styles.gradientBorder, { flex: 1 }]}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Image 
              source={require('@/assets/images/tiktok.png')} 
              style={styles.tiktokLogo}
              resizeMode="contain"
            />
            <Text style={styles.title}>TikTok</Text>
            {!data.success && (
              <View style={styles.fallbackIndicator}>
                <Text style={styles.fallbackText}>Sample</Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.visitButton}
            onPress={() => Linking.openURL(`https://www.tiktok.com/search?q=${encodeURIComponent(query)}`)}
          >
            <Text style={styles.visitButtonText}>Visit</Text>
            <ExternalLink size={14} color="#000000" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {!data.success && data.error && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>{data.error}</Text>
          </View>
        )}

          {/* TikTok video cards */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.videosContainer}
          scrollEnabled={true}
          alwaysBounceHorizontal={true}
          contentContainerStyle={{ 
            flexGrow: 1,
            minWidth: '100%',
            alignItems: 'flex-start'
          }}
          nestedScrollEnabled={true}
          removeClippedSubviews={true}
          scrollEventThrottle={16}
        >
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
                  onPress={() => handleVideoPress(video)}
                />
            </View>
          ))}
        </ScrollView>
        <View style={{ alignItems: 'center', marginTop: 6, marginBottom: 2 }}>
            <Text style={{ fontSize: 13, color: theme.colors.textSecondary, fontFamily: 'Inter-Medium' }}>swipe for more →</Text>
        </View>

        {enableSuggestions && (
          loadingSuggestions ? (
            <View style={{ width: '100%', marginTop: 8, marginBottom: 12 }}>
              <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>Navo is loading suggestions...</Text>
            </View>
          ) : suggestions.length > 0 ? (
            <View style={{ width: '100%', marginTop: 8, marginBottom: 12 }}>
              <Text style={{ fontSize: 13, color: theme.colors.textSecondary, fontFamily: 'Inter-Medium', marginBottom: 6 }}>Suggestions</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                scrollEnabled={true}
                alwaysBounceHorizontal={true}
              >
                {suggestions.map((s, i) => {
                  const isActive = activeSuggestion === s;
                  return (
                    <TouchableOpacity
                      key={`${s}-${i}`}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 16,
                        backgroundColor: isActive
                          ? (isDark ? 'rgba(59,130,246,0.20)' : 'rgba(59,130,246,0.12)')
                          : 'rgba(35,35,35,0.06)',
                        borderWidth: 0.75,
                        borderColor: isActive ? '#3B82F6' : 'rgba(69,69,69,0.12)',
                        marginRight: 8,
                      }}
                      onPress={() => handleSuggestionPress(s)}
                      activeOpacity={0.85}
                    >
                      <Text style={{ fontSize: 12, color: isDark ? '#000000' : (isActive ? '#1E3A8A' : theme.colors.text) }}>{s}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ) : null
        )}

        {enableSuggestions && (loadingMore || extraResults) && (
          <View style={{ width: '100%', marginTop: 12 }}>
            {loadingMore ? (
              <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>Loading more TikToks…</Text>
              </View>
            ) : extraResults && extraResults.length > 0 ? (
              <>
                <Text style={{ fontSize: 14, fontFamily: 'Inter-SemiBold', color: theme.colors.text, marginBottom: 8 }}>More like this</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  scrollEnabled={true}
                  alwaysBounceHorizontal={true}
                >
                  {extraResults.map((video, idx) => (
                    <View key={`extra-${video.id}-${idx}`} style={[styles.videoCardWrapper, idx === 0 && styles.firstVideo, { marginRight: 12, width: 220 }] }>
                      <TikTokVideoCard video={video} onPress={() => handleVideoPress(video)} cardWidth={220} cardHeight={300} />
                    </View>
                  ))}
                </ScrollView>
              </>
            ) : (
              <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>No additional results</Text>
            )}
          </View>
        )}
      </View>
    </View>

      {/* Video Modal */}
      {selectedVideo && (
        <TikTokVideoModal
          videos={data.videos}
          initialIndex={selectedIndex}
          isVisible={isModalVisible}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  gradientBorder: {
    borderRadius: 32,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 0,
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 8,
    gap: 12,
    width: '100%',
    maxWidth: 374,
    minHeight: 500,
    backgroundColor: '#FFFFFF',
    shadowColor: isDark ? '#000000' : 'transparent',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.25 : 0,
    shadowRadius: isDark ? 39.1 : 0,
    elevation: isDark ? 8 : 0,
    borderRadius: 32,
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    paddingHorizontal: 8,
    gap: 80,
    width: '100%',
    maxWidth: 358,
    height: 34,
  },
  titleContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 10,
    width: 100,
    height: 24,
  },
  tiktokLogo: {
    width: 20,
    height: 20,
  },
  title: {
    width: 70,
    height: 24,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: '#000000',
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
    backgroundColor: 'rgba(35, 35, 35, 0.06)',
    borderWidth: 0.56,
    borderColor: 'rgba(69, 69, 69, 0.12)',
    borderRadius: 20,
  },
  visitButtonText: {
    width: 33,
    height: 18,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 13,
    lineHeight: 18,
    color: '#000000',
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
    minHeight: 400, // Ensure minimum height for scrolling
  },
  videoCardWrapper: {
    width: 320,
    marginLeft: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'transparent',
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