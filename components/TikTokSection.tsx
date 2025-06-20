import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { Video, ExternalLink, Play, RefreshCw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { WebView } from 'react-native-webview';

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

function TikTokEmbed({ videoUrl, sectionHeight = 400 }: { videoUrl: string, sectionHeight?: number }) {
  const embedWidth = 320; // Match card width
  const webViewStyle: ViewStyle = {
    width: embedWidth,
    height: sectionHeight,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'transparent'
  };
  
  const embedHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script async src="https://www.tiktok.com/embed.js"></script>
        <style>
          body, html { 
            margin: 0; 
            padding: 0; 
            background: transparent; 
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            overflow: hidden;
          }
          .tiktok-embed { 
            width: ${embedWidth}px !important; 
            max-width: ${embedWidth}px !important; 
            min-width: 0 !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            margin: 0 auto !important;
            background: transparent !important;
          }
          .tiktok-embed iframe {
            display: block !important;
            margin: 0 auto !important;
            border: none !important;
            outline: none !important;
          }
          * {
            box-sizing: border-box;
          }
        </style>
      </head>
      <body>
        <blockquote class="tiktok-embed" cite="${videoUrl}" data-video-id="${videoUrl.split('/').filter(x => x).pop()}" style="width: ${embedWidth}px; max-width: ${embedWidth}px; min-width: 0; display: flex; justify-content: center; align-items: center; background: transparent;">
          <section></section>
        </blockquote>
      </body>
    </html>
  `;
  return (
    <WebView
      originWhitelist={['*']}
      source={{ html: embedHtml }}
      style={webViewStyle}
      javaScriptEnabled
      domStorageEnabled
      allowsFullscreenVideo
      scrollEnabled={false}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
    />
  );
}

export default function TikTokSection({ data, query, onRetry }: TikTokSectionProps) {
  const { theme } = useTheme();

  const styles = createStyles(theme);

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
              <Video size={20} color={theme.colors.text} strokeWidth={2} />
              <Text style={styles.title}>TikTok</Text>
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
    <LinearGradient
      colors={theme.gradients.tiktok as unknown as readonly [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradientBorder, { flex: 1 }]}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Video size={20} color={theme.colors.text} strokeWidth={2} />
            <Text style={styles.title}>TikTok</Text>
            {!data.success && (
              <View style={styles.fallbackIndicator}>
                <Text style={styles.fallbackText}>Sample</Text>
              </View>
            )}
          </View>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              if (data.videos && data.videos.length > 0) {
                Linking.openURL(data.videos[0].url);
              }
            }}
          >
            <ExternalLink size={16} color={theme.colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {!data.success && data.error && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>{data.error}</Text>
          </View>
        )}

        {/* TikTok embed cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.videosContainer}>
          {data.videos.map((video, idx) => (
            <View 
              key={video.id}
              style={[
                styles.videoCard, 
                idx === 0 && styles.firstVideo,
                idx === data.videos.length - 1 && { marginRight: 20 }
              ]}
            >
              <TikTokEmbed videoUrl={video.url} sectionHeight={400} />
              <View style={styles.videoInfo}>
                <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
                <Text style={styles.videoAuthor} numberOfLines={1}>@{video.author}</Text>
                <Text style={styles.videoViews}>{video.views} views</Text>
              </View>
            </View>
          ))}
        </ScrollView>
        <View style={{ alignItems: 'center', marginTop: 6, marginBottom: 2 }}>
          <Text style={{ fontSize: 13, color: theme.colors.textSecondary, fontFamily: 'Inter-Medium' }}>scroll →</Text>
        </View>
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
  videoCard: {
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
});