import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { ExternalLink, Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { SavedContentWithFolder } from '@/services/api';

interface FolderContentItemProps {
  content: SavedContentWithFolder;
  onDelete?: () => void;
  onPress?: () => void;
}

export default function FolderContentItem({ content, onDelete, onPress }: FolderContentItemProps) {
  const { theme, isDark } = useTheme();
  const createdAt = content.created_at ? new Date(content.created_at) : null;
  const formattedDate = createdAt && !isNaN(createdAt.getTime())
    ? createdAt.toLocaleDateString('en-GB')
    : '';

  if (content.content_type === 'tiktok') {
    return (
      <TouchableOpacity style={styles.tiktokCard} onPress={onPress} activeOpacity={0.85}>
        {content.thumbnail_url ? (
          <Image source={{ uri: content.thumbnail_url }} style={styles.tiktokImage} resizeMode="cover" />
        ) : (
          <View style={[styles.tiktokImage, { backgroundColor: '#000000' }]} />
        )}
        <View style={styles.tiktokOverlay}>
          <View style={styles.tiktokHeaderRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>TikTok</Text>
            </View>
            {formattedDate ? <Text style={styles.tiktokDate}>{formattedDate}</Text> : null}
          </View>
          <Text style={styles.tiktokTitle} numberOfLines={2}>{content.title}</Text>
          {content.description ? (
            <Text style={styles.tiktokDesc} numberOfLines={2}>{content.description}</Text>
          ) : null}
          <View style={styles.rightActionsDark}>
            {onDelete && (
              <TouchableOpacity onPress={onDelete} style={styles.iconBtnDark} activeOpacity={0.8}>
                <Trash2 size={16} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  if (content.content_type === 'reddit') {
    return (
      <TouchableOpacity style={styles.redditItem} onPress={onPress} activeOpacity={0.85}>
        <LinearGradient
          colors={isDark ? ['#FF45003D', '#0000003D'] : ['#FFF5F0', '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.redditGradient}
        >
          <View style={styles.redditHeader}>
            <View style={styles.redditBrand}>
              <Image source={require('@/assets/images/Reddit_Logo.png')} style={styles.redditLogo} resizeMode="contain" />
              <Text style={[styles.redditLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>Reddit</Text>
            </View>
            {formattedDate ? <Text style={[styles.redditTime, { color: isDark ? '#9A9CA9' : '#6B7280' }]}>{formattedDate}</Text> : <View />}
          </View>
          <View style={styles.redditBodyRow}>
            <View style={styles.redditTextCol}>
              <Text style={[styles.redditTitle, { color: isDark ? '#FFFFFF' : '#000000' }]} numberOfLines={2}>{content.title}</Text>
              {content.description ? (
                <Text style={[styles.redditDesc, { color: isDark ? '#9A9CA9' : '#6B7280' }]} numberOfLines={2}>{content.description}</Text>
              ) : null}
            </View>
            {content.thumbnail_url ? (
              <View style={styles.redditThumbWrap}>
                <Image source={{ uri: content.thumbnail_url }} style={styles.redditThumb} resizeMode="cover" />
              </View>
            ) : null}
          </View>
          <View style={[styles.redditActions, { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)' }]}>
            <View style={styles.redditLinkRow}>
              <Text style={[styles.redditMeta, { color: isDark ? '#9A9CA9' : '#6B7280' }]}>Saved</Text>
              <ExternalLink size={12} color="#9A9CA9" strokeWidth={1.5} />
            </View>
            {onDelete && (
              <TouchableOpacity onPress={onDelete} style={[styles.iconBtnLight, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F9FAFB' }]} activeOpacity={0.8}>
                <Trash2 size={16} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Default to AI/Gemini style mini card
  return (
    <TouchableOpacity style={[styles.aiCard, { backgroundColor: isDark ? 'rgba(33, 33, 33, 0.32)' : 'rgba(255, 255, 255, 0.95)' }]} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.aiHeaderRow}>
        <Image source={require('@/assets/images/blue.png')} style={styles.aiLogo} />
        <Text style={[styles.aiLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>Perplexity</Text>
        {formattedDate ? <Text style={[styles.aiDate, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{formattedDate}</Text> : null}
      </View>
      <Text style={[styles.aiSummary, { color: isDark ? '#FFFFFF' : '#000000' }]} numberOfLines={3}>{content.description || content.title}</Text>
      <View style={styles.aiActions}>
        <View style={[styles.aiSourcePill, { backgroundColor: isDark ? 'rgba(75, 85, 99, 0.4)' : 'rgba(209, 213, 219, 0.6)' }]}>
          <Text style={[styles.aiSourceText, { color: isDark ? '#FFFFFF' : '#1F2937' }]}>AI</Text>
        </View>
        {onDelete && (
          <TouchableOpacity onPress={onDelete} style={[styles.iconBtnLight, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F9FAFB' }]} activeOpacity={0.8}>
            <Trash2 size={16} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // TikTok style card
  tiktokCard: {
    width: '100%',
    height: 400,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#000000',
  },
  tiktokImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tiktokOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  tiktokHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tiktokTitle: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 20,
  },
  tiktokDesc: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  tiktokDate: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  rightActionsDark: {
    position: 'absolute',
    right: 8,
    top: 8,
    flexDirection: 'row',
    gap: 6,
  },
  iconBtnDark: {
    padding: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },

  // Reddit style item
  redditItem: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: 'transparent',
    marginBottom: 8,
  },
  redditGradient: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    width: '100%',
    minHeight: 140,
  },
  redditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  redditBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  redditLogo: {
    width: 18,
    height: 18,
  },
  redditLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#000000',
  },
  redditTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
  },
  redditBodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  redditTextCol: {
    flex: 1,
    gap: 6,
  },
  redditTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 20,
    color: '#000000',
  },
  redditDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#6B7280',
  },
  redditThumbWrap: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    flexShrink: 0,
  },
  redditThumb: {
    width: '100%',
    height: '100%',
  },
  redditActions: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  redditLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  redditMeta: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#9A9CA9',
  },

  // AI / Gemini mini card
  aiCard: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.06)',
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.18)',
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  aiLogo: {
    width: 18,
    height: 18,
    marginRight: 6,
  },
  aiLabel: {
    flex: 1,
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#000000',
  },
  aiDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
  },
  aiSummary: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#111827',
    marginBottom: 8,
  },
  aiActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiSourcePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderWidth: 0.75,
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  aiSourceText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#1E3A8A',
  },

  // Common
  iconBtnLight: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
});


