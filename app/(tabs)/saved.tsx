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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';
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
        setSavedSearches(searches);
      } else {
        setSavedSearches([]);
      }
    } catch (error) {
      console.error('Error loading saved searches:', error);
      setSavedSearches([]);
    } finally {
      setLoading(false);
    }
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
                {formatDate(item.timestamp)}
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
            {item.results ? (
              <>
                {item.results.gemini && (
                  <View style={styles.expandedSection}>
                    <GeminiSection
                      data={item.results.gemini}
                      query={item.query}
                      isLoading={false}
                      cached={true}
                    />
                  </View>
                )}
                {item.results.tiktok && (
                  <View style={styles.expandedSection}>
                    <TikTokSection
                      data={item.results.tiktok}
                      query={item.query}
                    />
                  </View>
                )}
                {item.results.reddit && (
                  <View style={styles.expandedSection}>
                    <RedditSection
                      data={item.results.reddit}
                      query={item.query}
                    />
                  </View>
                )}
              </>
            ) : (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>
                  No detailed results saved for this search
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved searches</Text>
        <Text style={styles.count}>{savedSearches.length}</Text>
      </View>
      <FlatList
        data={savedSearches}
        renderItem={renderSearchItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  count: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  listContainer: {
    padding: 20,
  },
  searchItemContainer: {
    marginBottom: 10,
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    overflow: 'hidden',
  },
  searchItem: {
    overflow: 'hidden',
  },
  searchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  searchIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  searchInfo: {
    flex: 1,
  },
  searchQuery: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 14,
    color: '#666666',
  },
  bookmarkContainer: {
    marginRight: 12,
  },
  expandButton: {
    padding: 4,
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  expandedSection: {
    marginBottom: 12,
  },
  noResultsContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});