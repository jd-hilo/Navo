import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { SavedSearchesService } from '@/services/database';
import { Search, ChevronDown, ChevronUp, Bookmark, Trash2, X } from 'lucide-react-native';
import GeminiSection from '@/components/GeminiSection';
import TikTokSection from '@/components/TikTokSection';
import RedditSection from '@/components/RedditSection';

interface SavedSearch {
  id: string;
  query: string;
  created_at: string;
  gemini_data: any;
  tiktok_data: any;
  reddit_data: any;
}

export default function SavedSearchesScreen() {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const styles = createStyles(theme, isDark);

  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const searches = await SavedSearchesService.getSavedSearches(user.id);
        setSavedSearches(searches);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes} min ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const toggleExpanded = (id: string) => {
    const next = new Set(expandedItems);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedItems(next);
  };

  const handleDelete = async (searchId: string) => {
    if (!user?.id) return;
    try {
      const success = await SavedSearchesService.deleteSavedSearch(user.id, searchId);
      if (success) setSavedSearches(prev => prev.filter(s => s.id !== searchId));
    } catch {}
  };

  const parseIfString = (data: any) => {
    if (data && typeof data === 'string') {
      try { return JSON.parse(data); } catch { return null; }
    }
    return data ?? null;
  };

  const renderItem = ({ item }: { item: SavedSearch }) => {
    const isExpanded = expandedItems.has(item.id);
    const geminiData = parseIfString(item.gemini_data);
    const tiktokData = parseIfString(item.tiktok_data);
    const redditData = parseIfString(item.reddit_data);
    return (
      <View style={styles.searchItemContainer}>
        <TouchableOpacity style={styles.searchItem} onPress={() => toggleExpanded(item.id)} activeOpacity={0.8}>
          <View style={styles.searchContent}>
            <View style={styles.searchIconContainer}>
              <Search size={20} color={theme.colors.textSecondary} strokeWidth={2} />
            </View>
            <View style={styles.searchInfo}>
              <Text style={styles.searchQuery} numberOfLines={1}>{item.query}</Text>
              <Text style={styles.timestamp}>{formatDate(item.created_at)}</Text>
            </View>
            <View style={styles.bookmarkContainer}>
              <Bookmark size={20} color="#5EEAD4" strokeWidth={2} fill="#5EEAD4" />
            </View>
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
              <Trash2 size={20} color="#FFFFFF" strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.expandButton} onPress={() => toggleExpanded(item.id)}>
              {isExpanded ? (
                <ChevronUp size={20} color={theme.colors.textSecondary} strokeWidth={2} />
              ) : (
                <ChevronDown size={20} color={theme.colors.textSecondary} strokeWidth={2} />
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <ScrollView
            style={styles.expandedContent}
            showsVerticalScrollIndicator
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 12 }}
          >
            {geminiData && (
              <View style={styles.expandedSection}>
                <View style={styles.moduleHeader}>
                  <View style={styles.moduleHeaderLeft}>
                    <Text style={styles.moduleTitle}>PERPLEXITY SONAR</Text>
                    <View style={[styles.priorityIndicator, { backgroundColor: '#10B981' }]} />
                  </View>
                </View>
                <GeminiSection 
                  data={geminiData} 
                  query={item.query} 
                  isLoading={false} 
                  cached={true} 
                  showSaveButton={false}
                  showSonarBadge={false}
                />
              </View>
            )}
            {tiktokData && (
              <View style={styles.expandedSection}>
                <View style={styles.moduleHeader}>
                  <View style={styles.moduleHeaderLeft}>
                    <Text style={styles.moduleTitle}>TIKTOK</Text>
                    <View style={[styles.priorityIndicator, { backgroundColor: '#F59E0B' }]} />
                  </View>
                </View>
                <TikTokSection data={tiktokData} query={item.query} />
              </View>
            )}
            {redditData && (
              <View style={styles.expandedSection}>
                <View style={styles.moduleHeader}>
                  <View style={styles.moduleHeaderLeft}>
                    <Text style={styles.moduleTitle}>REDDIT</Text>
                    <View style={[styles.priorityIndicator, { backgroundColor: '#6B7280' }]} />
                  </View>
                </View>
                <RedditSection data={redditData} query={item.query} />
              </View>
            )}
          </ScrollView>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Saved searches</Text>
          <Text style={styles.count}>{savedSearches.length}</Text>
        </View>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <X size={18} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading saved searches...</Text>
        </View>
      ) : savedSearches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No saved searches yet</Text>
        </View>
      ) : (
        <FlatList
          data={savedSearches}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text,
  },
  count: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: theme.colors.primary,
    backgroundColor: isDark ? 'rgba(94, 234, 212, 0.1)' : 'rgba(94, 234, 212, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  searchItemContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchItem: {
    padding: 16,
  },
  searchContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  searchInfo: {
    flex: 1,
    marginRight: 8,
  },
  searchQuery: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: theme.colors.text,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
  },
  bookmarkContainer: {
    marginRight: 8,
  },
  expandButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: isDark ? 'rgba(255, 87, 87, 0.1)' : 'rgba(255, 87, 87, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: 8,
  },
  expandedSection: {
    marginTop: 16,
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  moduleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moduleTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
  },
  priorityIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontFamily: 'Inter-Regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
  },
  listContainer: {
    paddingTop: 18,
    paddingBottom: 8,
  },
});


