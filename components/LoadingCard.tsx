import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles, Video, MessageCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

interface LoadingCardProps {
  title: string;
}

export default function LoadingCard({ title }: LoadingCardProps) {
  const { theme } = useTheme();

  const getIcon = () => {
    switch (title) {
      case 'Gemini':
        return <Sparkles size={20} color={theme.colors.textSecondary} strokeWidth={2} />;
      case 'TikTok':
        return <Video size={20} color={theme.colors.textSecondary} strokeWidth={2} />;
      case 'Reddit':
        return <MessageCircle size={20} color={theme.colors.textSecondary} strokeWidth={2} />;
      default:
        return <Sparkles size={20} color={theme.colors.textSecondary} strokeWidth={2} />;
    }
  };

  const getGradientColors = () => {
    switch (title) {
      case 'Gemini':
        return theme.gradients.gemini;
      case 'TikTok':
        return theme.gradients.tiktok;
      case 'Reddit':
        return theme.gradients.reddit;
      default:
        return theme.gradients.gemini;
    }
  };

  const styles = createStyles(theme);

  return (
    <LinearGradient
      colors={getGradientColors() as unknown as readonly [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBorder}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            {getIcon()}
            <Text style={styles.title}>{title}</Text>
          </View>
        </View>
        
        <View style={styles.loadingContent}>
          <View style={styles.loadingLine} />
          <View style={[styles.loadingLine, styles.loadingLineShort]} />
          <View style={styles.loadingLine} />
        </View>
        
        <Text style={styles.loadingText}>Loading...</Text>
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
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  loadingContent: {
    marginBottom: 12,
  },
  loadingLine: {
    height: 12,
    backgroundColor: theme.colors.loadingLine,
    borderRadius: 6,
    marginBottom: 8,
  },
  loadingLineShort: {
    width: '70%',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});