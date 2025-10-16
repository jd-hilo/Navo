import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Image, ActivityIndicator, Modal, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { ExternalLink, X } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '@/contexts/ThemeContext';

interface TikTokVideo {
  id: string;
  title: string;
  thumbnail: string;
  author: string;
  views: string;
  url: string;
}

const extractTikTokVideoId = (url: string): string | null => {
  try {
    const parts = url.split('/video/');
    if (parts.length > 1) {
      return parts[1].split('?')[0];
    }
    return null;
  } catch {
    return null;
  }
};

export default function TikTokModal({
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
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    setCurrentIndex(Math.max(0, Math.min(initialIndex, videos.length - 1)));
  }, [initialIndex, videos.length]);

  const handleOpenInBrowser = () => {
    const current = videos[currentIndex];
    if (current?.url) {
      try { require('react-native').Linking.openURL(current.url); } catch {}
    }
    onClose();
  };

  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <StatusBar hidden />
      <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' }}>
            {/* Top Controls */}
            <View style={{ position: 'absolute', top: -10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, zIndex: 2 }}>
              <TouchableOpacity onPress={onClose} style={{ padding: 8, backgroundColor: 'rgba(0, 0, 0, 0.5)', borderRadius: 20 }}>
                <X size={24} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleOpenInBrowser} style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontFamily: 'Inter-Medium' }}>Open in TikTok</Text>
                <ExternalLink size={16} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* Swipeable Video List */}
            <View style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} contentOffset={{ x: currentIndex * screenWidth, y: 0 }} onMomentumScrollEnd={(e) => { const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth); setCurrentIndex(index); }} style={{ flex: 1, width: '100%' }}>
                {videos.map((item, idx) => {
                  const isActive = idx === currentIndex;
                  const videoId = extractTikTokVideoId(item.url);
                  const embedUrl = isActive && videoId ? `https://www.tiktok.com/player/v1/${videoId}?autoplay=1&loop=1&mute=0&controls=1` : '';
                  return (
                    <View key={item.id || String(idx)} style={{ width: screenWidth, alignItems: 'center', justifyContent: 'center' }}>
                      <View style={{ width: '85%', aspectRatio: 9/16, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000000', marginTop: -20 }}>
                        {embedUrl ? (
                          <WebView source={{ uri: embedUrl }} style={{ flex: 1 }} javaScriptEnabled domStorageEnabled allowsInlineMediaPlayback mediaPlaybackRequiresUserAction={false} useWebKit scrollEnabled={false} startInLoadingState renderLoading={() => (
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' }}>
                              <ActivityIndicator size="large" color="#FFFFFF" />
                            </View>
                          )} />
                        ) : (
                          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' }}>
                            <Image source={{ uri: item.thumbnail || 'https://via.placeholder.com/400x600/000000/FFFFFF?text=TikTok' }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
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


