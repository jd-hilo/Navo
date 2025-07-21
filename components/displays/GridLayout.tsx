import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface GridLayoutProps {
  data: any;
  type: 'gemini' | 'tiktok' | 'reddit' | 'pinterest';
  query: string;
  onRetry?: () => void;
}

export default function GridLayout({ data, type, query, onRetry }: GridLayoutProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Grid Layout - {type}</Text>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  text: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text,
  },
}); 