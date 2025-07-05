import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Search, ChevronDown, ChevronUp, Bookmark } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import GeminiSection from '@/components/GeminiSection';
import TikTokSection from '@/components/TikTokSection';
import RedditSection from '@/components/RedditSection';
import { SavedSearchesService } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';

interface SavedSearch {
  id: string;
  query: string;
  created_at: string;
  gemini_data: any;
  tiktok_data: any;
  reddit_data: any;
}

export default function SavedScreen() {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Load saved searches when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadSavedSearches();
      }
    }, [user?.id])
  );

  const loadSavedSearches = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const searches = await SavedSearchesService.getSavedSearches(user.id);
      setSavedSearches(searches);
    } catch (error) {
      console.error('Error loading saved searches:', error);
      setSavedSearches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (searchId: string) => {
    if (!user?.id) return;

    Alert.alert(
      'Delete Saved Search',
      'Are you sure you want to delete this saved search?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await SavedSearchesService.deleteSavedSearch(user.id, searchId);
              if (success) {
                setSavedSearches(prev => prev.filter(search => search.id !== searchId));
              }
            } catch (error) {
              console.error('Error deleting saved search:', error);
              Alert.alert('Error', 'Failed to delete saved search');
            }
          },
        },
      ]
    );
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes} min`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderSearchItem = ({ item }: { item: SavedSearch }) => {
    const isExpanded = expandedItems.has(item.id);
    
    return (
      <View style={styles.searchItemContainer}>
        <TouchableOpacity
          style={styles.searchItem}
          onPress={() => toggleExpanded(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.searchContent}>
            <View style={styles.searchIconContainer}>
              <Search size={20} color={theme.colors.textSecondary} strokeWidth={2} />
            </View>
            <View style={styles.searchInfo}>
              <Text style={styles.searchQuery} numberOfLines={1}>
                {item.query}
              </Text>
              <Text style={styles.timestamp}>
                {formatDate(item.created_at)}
              </Text>
            </View>
            <View style={styles.bookmarkContainer}>
              <Bookmark size={20} color="#5EEAD4" strokeWidth={2} fill="#5EEAD4" />
            </View>
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => toggleExpanded(item.id)}
            >
              {isExpanded ? (
                <ChevronUp size={20} color={theme.colors.textSecondary} strokeWidth={2} />
              ) : (
                <ChevronDown size={20} color={theme.colors.textSecondary} strokeWidth={2} />
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Expanded Results */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {item.gemini_data && (
              <View style={styles.expandedSection}>
                <GeminiSection
                  data={item.gemini_data}
                  query={item.query}
                  isLoading={false}
                  cached={true}
                />
              </View>
            )}
            {item.tiktok_data && (
              <View style={styles.expandedSection}>
                <TikTokSection
                  data={item.tiktok_data}
                  query={item.query}
                />
              </View>
            )}
            {item.reddit_data && (
              <View style={styles.expandedSection}>
                <RedditSection
                  data={item.reddit_data}
                  query={item.query}
                />
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    title: {
      fontSize: 28,
      fontFamily: 'Inter-Bold',
      color: theme.colors.text,
    },
    count: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: theme.colors.primary,
      backgroundColor: isDark ? 'rgba(94, 234, 212, 0.1)' : 'rgba(94, 234, 212, 0.15)',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
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
      paddingVertical: 8,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved searches</Text>
        <Text style={styles.count}>{savedSearches.length}</Text>
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
          renderItem={renderSearchItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}