import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { ExternalLink } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface RedditPost {
  id: string;
  title: string;
  subreddit: string;
  upvotes: number;
  comments: number;
  preview?: string;
  text?: string;
  url: string;
  created: string;
  media?: string | null;
  thumbnail?: string | null;
}

export default function RedditModal({ post, isVisible, onClose }: { post: RedditPost; isVisible: boolean; onClose: () => void; }) {
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(false);

  const formatDateOnly = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-GB');
  };

  return (
    <Modal visible={isVisible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF', borderRadius: 16, padding: 16, paddingTop: 12, width: '90%', height: '80%', shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingTop: 40 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Image source={require('@/assets/images/Reddit_Logo.png')} style={{ width: 20, height: 20, marginRight: 8 }} resizeMode="contain" />
              <Text style={{ fontSize: 14, fontFamily: 'Inter-SemiBold', color: isDark ? '#FFFFFF' : '#000000', marginRight: 8 }}>r/{post.subreddit}</Text>
              <Text style={{ fontSize: 12, fontFamily: 'Inter-Regular', color: isDark ? '#9A9CA9' : '#6B7280', lineHeight: 16 }}>{formatDateOnly(post.created)}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Text style={{ color: isDark ? '#FFFFFF' : '#000000', fontSize: 18, fontWeight: 'bold', lineHeight: 20 }}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}>
            <Text style={{ fontSize: 20, fontFamily: 'Inter-Bold', color: isDark ? '#FFFFFF' : '#000000', marginBottom: 8, lineHeight: 26 }}>{post.title}</Text>
            {(post.text || post.preview) && (
              <Text style={{ fontSize: 17, fontFamily: 'Inter-Regular', color: isDark ? '#FFFFFF' : '#000000', marginBottom: 16, lineHeight: 24 }}>{post.text || post.preview}</Text>
            )}
            {(post.media || post.thumbnail) && (
              <View style={{ width: '100%', borderRadius: 16, overflow: 'hidden', marginTop: 12, marginBottom: 16, backgroundColor: 'rgba(0, 0, 0, 0.05)' }}>
                <Image source={{ uri: post.media || post.thumbnail || '' }} style={{ width: '100%', aspectRatio: 1 }} resizeMode="contain" onError={() => {}} />
              </View>
            )}
            <View style={{ flexDirection: 'row', marginBottom: 16 }}>
              <Text style={{ fontSize: 13, fontFamily: 'Inter-Regular', color: isDark ? '#9A9CA9' : '#6B7280', marginRight: 16 }}>{post.upvotes} upvotes</Text>
              <Text style={{ fontSize: 13, fontFamily: 'Inter-Regular', color: isDark ? '#9A9CA9' : '#6B7280' }}>{post.comments} comments</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}






