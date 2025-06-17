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
import { Trash2, Search, ChevronDown, ChevronUp, Calendar, Sparkles, Video, MessageCircle, MoreVertical } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import GeminiSection from '@/components/GeminiSection';
import TikTokSection from '@/components/TikTokSection';
import RedditSection from '@/components/RedditSection';

interface SavedSearch {
  id: string;
  query: string;
  timestamp: number;
  results?: {
    gemini?: any;
    tiktok?: any;
    reddit?: any;
  };
}

export default function SavedScreen() {
  const { theme } = useTheme();
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Load saved searches when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadSavedSearches();
    }, [])
  );

  const loadSavedSearches = async () => {
    try {
      setLoading(true);
      const saved = await AsyncStorage.getItem('savedSearches');
      if (saved) {
        const searches = JSON.parse(saved);
        console.log('📚 Loaded saved searches:', searches.length);
        setSavedSearches(searches);
      } else {
        console.log('📚 No saved searches found');
        setSavedSearches([]);
      }
    } catch (error) {
      console.error('❌ Error loading saved searches:', error);
      setSavedSearches([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteSearch = async (id: string) => {
    console.log(`🗑️ Delete button pressed for search ID: ${id}`);
    
    Alert.alert(
      'Delete Saved Search',
      'Are you sure you want to remove this saved search?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => console.log('❌ Delete cancelled')
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log(`🗑️ Confirming deletion of search ID: ${id}`);
              
              // Get current saved searches from state
              const currentSearches = [...savedSearches];
              console.log('📊 Current searches before delete:', currentSearches.length);
              
              // Find the search to delete
              const searchToDelete = currentSearches.find(search => search.id === id);
              if (searchToDelete) {
                console.log(`🎯 Found search to delete: "${searchToDelete.query}" (ID: ${id})`);
              } else {
                console.log(`⚠️ Search with ID ${id} not found in current state`);
              }
              
              // Filter out the search with the matching ID
              const updatedSearches = currentSearches.filter(search => {
                const keep = search.id !== id;
                if (!keep) {
                  console.log(`🗑️ Removing search: "${search.query}" (ID: ${search.id})`);
                }
                return keep;
              });
              
              console.log('📊 Searches after filter:', updatedSearches.length);
              
              // Update state immediately for better UX
              setSavedSearches(updatedSearches);
              
              // Update AsyncStorage
              await AsyncStorage.setItem('savedSearches', JSON.stringify(updatedSearches));
              console.log('💾 AsyncStorage updated successfully');
              
              // Verify the deletion by reading from AsyncStorage
              const verification = await AsyncStorage.getItem('savedSearches');
              const verifiedSearches = verification ? JSON.parse(verification) : [];
              console.log('✅ Verification: AsyncStorage now contains', verifiedSearches.length, 'searches');
              
              console.log(`✅ Successfully deleted search with ID: ${id}`);
              
              // Show success feedback only if there are remaining searches
              if (updatedSearches.length > 0) {
                // Brief success feedback without blocking UI
                setTimeout(() => {
                  console.log('✅ Delete operation completed successfully');
                }, 100);
              }
              
            } catch (error) {
              console.error('❌ Error deleting saved search:', error);
              
              // Revert state on error by reloading from storage
              console.log('🔄 Reverting state due to error...');
              await loadSavedSearches();
              
              Alert.alert('Error', 'Failed to delete saved search. Please try again.');
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

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderResultsPreview = (results: any) => {
    if (!results) return null;

    return (
      <View style={styles.resultsPreview}>
        {/* Gemini Preview */}
        {results.gemini?.response && (
          <View style={styles.resultItem}>
            <View style={styles.resultHeader}>
              <Sparkles size={16} color={theme.colors.textSecondary} strokeWidth={2} />
              <Text style={styles.resultTitle}>Gemini</Text>
              {results.gemini.success && (
                <View style={styles.liveIndicator}>
                  <Text style={styles.liveText}>Live</Text>
                </View>
              )}
            </View>
            <Text style={styles.resultPreview} numberOfLines={2}>
              {results.gemini.response}
            </Text>
          </View>
        )}

        {/* TikTok Preview */}
        {results.tiktok?.videos && results.tiktok.videos.length > 0 && (
          <View style={styles.resultItem}>
            <View style={styles.resultHeader}>
              <Video size={16} color={theme.colors.textSecondary} strokeWidth={2} />
              <Text style={styles.resultTitle}>TikTok</Text>
              <Text style={styles.resultCount}>
                {results.tiktok.videos.length} videos
              </Text>
            </View>
            <Text style={styles.resultPreview} numberOfLines={1}>
              {results.tiktok.videos[0]?.title || 'Video content'}
            </Text>
          </View>
        )}

        {/* Reddit Preview */}
        {results.reddit?.posts && results.reddit.posts.length > 0 && (
          <View style={styles.resultItem}>
            <View style={styles.resultHeader}>
              <MessageCircle size={16} color={theme.colors.textSecondary} strokeWidth={2} />
              <Text style={styles.resultTitle}>Reddit</Text>
              <Text style={styles.resultCount}>
                {results.reddit.posts.length} posts
              </Text>
            </View>
            <Text style={styles.resultPreview} numberOfLines={1}>
              {results.reddit.posts[0]?.title || 'Discussion content'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderSearchItem = ({ item }: { item: SavedSearch }) => {
    const isExpanded = expandedItems.has(item.id);
    const isMenuOpen = menuOpenId === item.id;
    
    return (
      <LinearGradient
        colors={theme.gradients.gemini as [string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}>
        <View style={styles.searchItem}>
          {/* Menu button in top right of card */}
          <View style={styles.menuButtonWrapper}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setMenuOpenId(isMenuOpen ? null : item.id)}
              activeOpacity={0.7}
            >
              <MoreVertical size={20} color={theme.colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
            {isMenuOpen && (
              <View style={styles.menuPopover}>
                <TouchableOpacity
                  style={styles.menuDeleteButton}
                  onPress={() => {
                    setMenuOpenId(null);
                    deleteSearch(item.id);
                  }}
                >
                  <Trash2 size={18} color={theme.colors.textSecondary} strokeWidth={2} />
                  <Text style={styles.menuDeleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <TouchableOpacity 
            style={styles.searchHeader}
            onPress={() => toggleExpanded(item.id)}
            activeOpacity={0.7}>
            <View style={styles.searchContent}>
              <Search size={20} color={theme.colors.text} strokeWidth={2} />
              <View style={styles.searchText}>
                <Text style={styles.searchQuery}>{item.query}</Text>
                <View style={styles.searchMeta}>
                  <Calendar size={12} color={theme.colors.textSecondary} strokeWidth={2} />
                  <Text style={styles.searchDate}>
                    {formatDate(item.timestamp)}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.searchActions}>
              <TouchableOpacity
                style={styles.expandButton}
                onPress={() => toggleExpanded(item.id)}>
                {isExpanded ? (
                  <ChevronUp size={20} color={theme.colors.textSecondary} strokeWidth={2} />
                ) : (
                  <ChevronDown size={20} color={theme.colors.textSecondary} strokeWidth={2} />
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {/* Expanded Results - show cards exactly as in search */}
          {isExpanded && item.results && (
            <View style={styles.expandedCardsWrapper}>
              <View style={styles.expandedDivider} />
              {item.results.gemini && (
                <View style={styles.expandedCardSection}>
                  <GeminiSection
                    data={item.results.gemini}
                    query={item.query}
                    isLoading={false}
                    cached={true}
                  />
                </View>
              )}
              {item.results.tiktok && (
                <View style={styles.expandedCardSection}>
                  <TikTokSection
                    data={item.results.tiktok}
                    query={item.query}
                  />
                </View>
              )}
              {item.results.reddit && (
                <View style={styles.expandedCardSection}>
                  <RedditSection
                    data={item.results.reddit}
                    query={item.query}
                  />
                </View>
              )}
            </View>
          )}
          {/* If no results, show message */}
          {isExpanded && !item.results && (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>
                No detailed results saved for this search
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
    );
  };

  const styles = createStyles(theme);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Saved Searches</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Searches</Text>
        <Text style={styles.subtitle}>
          {savedSearches.length > 0 
            ? `${savedSearches.length} saved search${savedSearches.length === 1 ? '' : 'es'}`
            : 'Your bookmarked searches will appear here'
          }
        </Text>
      </View>

      {savedSearches.length === 0 ? (
        <View style={styles.emptyState}>
          <Search size={48} color={theme.colors.textSecondary} strokeWidth={1} />
          <Text style={styles.emptyTitle}>No saved searches</Text>
          <Text style={styles.emptySubtitle}>
            Bookmark your searches to save them here for later viewing
          </Text>
        </View>
      ) : (
        <FlatList
          data={savedSearches}
          renderItem={renderSearchItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          extraData={expandedItems} // Re-render when expanded items change
          removeClippedSubviews={false} // Ensure all items are rendered properly
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  gradientBorder: {
    borderRadius: 14,
    padding: 2,
    marginBottom: 12,
  },
  searchItem: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchHeader: {
    padding: 16,
  },
  searchContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchText: {
    marginLeft: 12,
    flex: 1,
  },
  searchQuery: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  searchMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  searchActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandButton: {
    padding: 8,
    marginRight: 4,
  },
  menuButton: {
    padding: 8,
    marginLeft: 0,
  },
  menuPopover: {
    position: 'absolute',
    top: 12,
    right: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 100,
    minWidth: 110,
    paddingVertical: 4,
  },
  menuDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.border,
  },
  menuDeleteText: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  expandedCardsWrapper: {
    paddingHorizontal: 0,
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
  },
  expandedDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 8,
  },
  expandedCardSection: {
    marginBottom: 8,
    borderRadius: 0,
    paddingHorizontal: 0,
    transform: [{ scale: 0.95 }],
  },
  resultsPreview: {
    gap: 12,
  },
  resultItem: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  resultTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginLeft: 6,
    flex: 1,
  },
  resultCount: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
  },
  liveIndicator: {
    backgroundColor: theme.colors.indicator.webSearch,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: theme.colors.indicator.webSearchText,
  },
  resultPreview: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  noResultsContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  menuButtonWrapper: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 101,
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
});