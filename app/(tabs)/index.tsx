import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Animated,
  Dimensions,
  Platform,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Bookmark } from 'lucide-react-native';
import SearchBar from '@/components/SearchBar';
import GeminiSection from '@/components/GeminiSection';
import TikTokSection from '@/components/TikTokSection';
import RedditSection from '@/components/RedditSection';
import LoadingCard from '@/components/LoadingCard';
import ErrorCard from '@/components/ErrorCard';
import { searchAllSources } from '@/services/api';
import { debounce } from '@/utils/debounce';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { SearchResultsService } from '@/services/database';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

// Get current date for news suggestions
const getCurrentDate = () => {
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  };
  return today.toLocaleDateString('en-US', options);
};

const SEARCH_SUGGESTIONS = [

  `Tech News ${getCurrentDate()}`,
  'How to lose weight fast',
  'Best movies 2025',
  'Restaurants near me',
  'Weather today',
  'How to make money online',
  'Best workout routine',
  'Healthy breakfast ideas',
  'Travel deals this week',
  'How to cook pasta',
  'Best gaming laptops',
  'How to meditate',
  'Latest iPhone rumors',
  'How to save money',
  'Best dating apps',
  'How to sleep better',
  'Latest sports scores',
  'How to learn guitar',
  'Best Netflix shows',
];

// Configurable suggestion styling constants - EDIT THESE VALUES
const SUGGESTION_CONFIG = {
  // Container spacing - controls overall padding around suggestions
  containerPaddingHorizontal: 20, // Reduced from 28 to 20
  containerPaddingVertical: 0,    // No vertical padding for flush appearance
  
  // Individual chip styling - controls each suggestion button
  chipPaddingHorizontal: 16,      // Reduced from 24 to 16 (smaller chips)
  chipPaddingVertical: 8,         // Reduced from 12 to 8 (shorter chips)
  chipMarginHorizontal: 6,        // Reduced from 10 to 6 (less space between chips)
  chipBorderRadius: 16,           // Reduced from 24 to 16 (less rounded)
  
  // Typography
  fontSize: 12,                   // Reduced from 14 to 12 (smaller text)
  fontWeight: 'Inter-Medium' as const,
  
  // Positioning
  gapFromSearchBar: -8,            // Negative value to ensure suggestions are flush with search bar
  
  // Animation
  animationDuration: 300,
};

export default function HomeScreen() {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isBookmarkSaved, setIsBookmarkSaved] = useState(false);

  // Animation values
  const searchBarPosition = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const cardsTranslateY = useRef(new Animated.Value(screenHeight)).current;
  const cardsOpacity = useRef(new Animated.Value(0)).current;
  const suggestionsOpacity = useRef(new Animated.Value(1)).current;
  const bookmarkScale = useRef(new Animated.Value(0)).current;
  const bookmarkOpacity = useRef(new Animated.Value(0)).current;

  // Debounce search query
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setDebouncedQuery(query);
    }, 500),
    []
  );

  // IMPORTANT: Move useQuery hook to the top, before any useEffect that uses searchResults
  const {
    data: searchResults,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchAllSources(debouncedQuery),
    enabled: debouncedQuery.length > 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error) => {
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Handle search results and increment count
  useEffect(() => {
    if (debouncedQuery && searchResults && user?.id) {
      console.log('🔍 Search completed, incrementing count...');
      SearchResultsService.incrementSearchCount(user.id)
        .then(success => {
          if (success) {
            console.log('✅ Search count incremented successfully');
          } else {
            console.error('❌ Failed to increment search count');
          }
        })
        .catch(error => {
          console.error('❌ Error incrementing search count:', error);
        });
    }
  }, [debouncedQuery, searchResults, user?.id]);

  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      debouncedSearch(searchQuery);
      if (!hasSearched) {
        setHasSearched(true);
        animateToSearchMode();
      }
    } else {
      setDebouncedQuery('');
        setHasSearched(false);
        animateToInitialMode();
    }
  }, [searchQuery, debouncedSearch, hasSearched]);

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Show bookmark when search results are available
  useEffect(() => {
    if (searchResults && debouncedQuery && !isBookmarkSaved) {
      showBookmarkButton();
    } else if (!debouncedQuery) {
      hideBookmarkButton();
      setIsBookmarkSaved(false);
    }
  }, [searchResults, debouncedQuery, isBookmarkSaved]);

  useEffect(() => {
    if (debouncedQuery && searchResults) {
      saveSearch(debouncedQuery);
    }
  }, [debouncedQuery, searchResults]);

  const animateToSearchMode = () => {
    // Animate search bar to top and show cards immediately
    Animated.parallel([
      Animated.timing(searchBarPosition, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(headerOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(suggestionsOpacity, {
        toValue: 0,
        duration: SUGGESTION_CONFIG.animationDuration,
        useNativeDriver: true,
      }),
      // Animate cards in immediately when search starts
      Animated.spring(cardsTranslateY, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(cardsOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateToInitialMode = () => {
    Animated.parallel([
      Animated.timing(searchBarPosition, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(suggestionsOpacity, {
        toValue: 1,
        duration: SUGGESTION_CONFIG.animationDuration,
        useNativeDriver: true,
      }),
      Animated.timing(cardsTranslateY, {
        toValue: screenHeight,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(cardsOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const showBookmarkButton = () => {
    Animated.parallel([
      Animated.spring(bookmarkScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(bookmarkOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideBookmarkButton = () => {
    Animated.parallel([
      Animated.spring(bookmarkScale, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(bookmarkOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadRecentSearches = async () => {
    try {
      const recent = await AsyncStorage.getItem('recentSearches');
      if (recent) {
        // Handle recent searches if needed
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const saveSearch = async (query: string) => {
    try {
      const recent = await AsyncStorage.getItem('recentSearches');
      const searches = recent ? JSON.parse(recent) : [];
      const newSearches = [query, ...searches.filter((s: string) => s !== query)].slice(0, 10);
      await AsyncStorage.setItem('recentSearches', JSON.stringify(newSearches));
    } catch (error) {
      console.error('Error saving search:', error);
    }
  };

  const saveBookmark = async () => {
    if (!searchResults || !debouncedQuery) return;

    try {
      const savedSearches = await AsyncStorage.getItem('savedSearches');
      const searches = savedSearches ? JSON.parse(savedSearches) : [];
      
      const searchData = {
        id: `search_${Date.now()}`,
        query: debouncedQuery,
        timestamp: Date.now(),
        results: searchResults,
      };

      // Check if this query is already saved
      const existingIndex = searches.findIndex((s: any) => s.query === debouncedQuery);
      if (existingIndex >= 0) {
        // Update existing search
        searches[existingIndex] = searchData;
      } else {
        // Add new search at the beginning
        searches.unshift(searchData);
      }

      // Keep only the last 50 saved searches
      const limitedSearches = searches.slice(0, 50);
      
      await AsyncStorage.setItem('savedSearches', JSON.stringify(limitedSearches));
      setIsBookmarkSaved(true);

      // Animate bookmark to show it's saved
      Animated.sequence([
        Animated.spring(bookmarkScale, {
          toValue: 1.2,
          tension: 150,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.spring(bookmarkScale, {
          toValue: 1,
          tension: 150,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();

    } catch (error) {
      console.error('Error saving bookmark:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    if (debouncedQuery) {
      setRefreshing(true);
      await refetch();
      setRefreshing(false);
    }
  }, [debouncedQuery, refetch]);

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    animateToInitialMode();
  };

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleSuggestionPress = (suggestion: string) => {
    setSearchQuery(suggestion);
    // This will trigger the useEffect and start the search
  };

  const styles = createStyles(theme);

  // Calculate search bar width and positioning
  const searchBarWidth = Math.min(screenWidth * 0.85, 400); // Search bar is 85% of screen
  const searchBarLeftMargin = (screenWidth - searchBarWidth) / 2;
  const cardsWidth = Math.min(screenWidth * 0.92, 400); // Cards are 92% of screen
  const cardsLeftMargin = (screenWidth - cardsWidth) / 2;

  // Interpolate search bar position - move to very top
  const searchBarTranslateY = searchBarPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [screenHeight * 0.4, Platform.OS === 'web' ? 20 : 60],
  });

  const searchBarScale = searchBarPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [1.1, 0.95],
  });

  // Calculate the results container position using transform
  const searchBarHeight = Platform.OS === 'ios' ? 48 : 46;
  const resultsTranslateY = searchBarPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [screenHeight, (Platform.OS === 'web' ? 20 : 60) + searchBarHeight + 2], // Minimal 2px gap
  });

  // Calculate suggestions position using transform
  const suggestionsTranslateY = searchBarPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [
      screenHeight * 0.4 + 80, 
      (Platform.OS === 'web' ? 20 : 60) + searchBarHeight + SUGGESTION_CONFIG.gapFromSearchBar
    ],
  });

  return (
    <LinearGradient
      colors={isDark ? ['#0F0F0F', '#1A1A1A', '#0F0F0F'] : ['#F7F7F5', '#FFFFFF', '#F7F7F5']}
      style={styles.container}>
      
      {/* Background Pattern */}
      <View style={styles.backgroundPattern}>
        {Array.from({ length: 20 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.patternLine,
              {
                transform: [
                  { rotate: `${-15 + (i * 2)}deg` },
                  { translateX: i * 50 - 200 },
                  { translateY: i * 30 - 100 },
                ],
                opacity: isDark ? 0.03 : 0.02,
                // Hide pattern lines that would be behind the search bar
                display:
                  // Calculate the vertical position of the line
                  (screenHeight * 0.4 + 20 <
                    (Platform.OS === 'web' ? 20 : 60) + searchBarHeight + 2 &&
                    screenHeight * 0.4 + 80 >
                    (Platform.OS === 'web' ? 20 : 60))
                    ? 'none'
                    : undefined,
              },
            ]}
          />
        ))}
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* Animated Header with Logo */}
        <Animated.View style={[styles.headerContainer, { opacity: headerOpacity }]}>
          <Image
            source={isDark ? require('@/assets/images/logo in dark.png') : require('@/assets/images/logo in light.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          {user && (
            <Text style={styles.welcomeText}>
              Welcome back, {user.name || user.email.split('@')[0]}!
            </Text>
          )}
        </Animated.View>

        {/* Animated Search Bar */}
        <Animated.View
          style={[
            styles.searchContainer,
            {
              position: 'absolute',
              left: searchBarLeftMargin,
              width: searchBarWidth,
              transform: [
                { translateY: searchBarTranslateY },
                { scale: searchBarScale }
              ],
              zIndex: 100,
              backgroundColor: 'transparent',
            },
          ]}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={handleClearSearch}
            placeholder="Create a search for..."
          />
        </Animated.View>

        {/* Search Suggestions - positioned right under search bar */}
        <Animated.View
          style={[
            styles.suggestionsContainer,
            {
              position: 'absolute',
              left: 0,
              right: 0,
              opacity: suggestionsOpacity,
              transform: [{ translateY: suggestionsTranslateY }],
              zIndex: 5,
            },
          ]}>
          <View style={styles.suggestionsWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsContent}>
              {SEARCH_SUGGESTIONS.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionChip}
                  onPress={() => handleSuggestionPress(suggestion)}
                  activeOpacity={0.7}>
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Animated.View>

        {/* Bookmark Button - Animated */}
        <Animated.View
          style={[
            styles.bookmarkContainer,
            {
              opacity: bookmarkOpacity,
              transform: [{ scale: bookmarkScale }],
            },
          ]}>
          <TouchableOpacity
            style={[styles.bookmarkButton, isBookmarkSaved && styles.bookmarkButtonSaved]}
            onPress={saveBookmark}
            activeOpacity={0.8}>
            <Bookmark 
              size={24} 
              color={isBookmarkSaved ? (isDark ? '#000000' : '#FFFFFF') : theme.colors.text} 
              strokeWidth={2}
              fill={isBookmarkSaved ? (isDark ? '#000000' : '#FFFFFF') : 'none'}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Results Container - Absolutely positioned under search bar */}
        {hasSearched && (
          <Animated.View
            style={{
              position: 'absolute',
              top: (Platform.OS === 'web' ? 20 : 60) + searchBarHeight + 2, // 2px gap below search bar
              left: 0,
              right: 0,
              zIndex: 1, // Between background (0) and search bar (100)
              opacity: cardsOpacity,
              alignItems: 'center',
              // Ensure it fills the rest of the screen
              bottom: 0,
            }}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: 260, alignItems: 'center' } // Removed paddingTop
              ]}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            >
              <View style={{ width: cardsWidth, marginTop: 12 }}>
                {isLoading ? (
                  <>
                    <LoadingCard title="Gemini" />
                    <LoadingCard title="TikTok" />
                    <LoadingCard title="Reddit" />
                  </>
                ) : error ? (
                  <ErrorCard
                    title="Search Error"
                    message={error.message}
                    onRetry={handleRetry}
                  />
                ) : searchResults ? (
                  <>
                    <GeminiSection
                      data={searchResults.gemini}
                      query={debouncedQuery}
                      onRetry={handleRetry}
                      isLoading={isLoading}
                    />
                    <TikTokSection
                      data={searchResults.tiktok}
                      query={debouncedQuery}
                      onRetry={handleRetry}
                    />
                    <RedditSection
                      data={searchResults?.reddit || { posts: [], success: false, error: 'No Reddit data available', text: '' }}
                      query={debouncedQuery}
                      onRetry={handleRetry}
                      isLoading={isLoading}
                    />
                  </>
                ) : null}
              </View>
            </ScrollView>
          </Animated.View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  patternLine: {
    position: 'absolute',
    width: 2,
    height: 200,
    backgroundColor: theme.colors.text,
  },
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' ? 80 : 60,
    paddingHorizontal: 32,
  },
  logo: {
    width: 200,
    height: 80,
    maxWidth: '80%',
  },
  welcomeText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  searchContainer: {
    // Positioned absolutely with responsive width, styles handled by animation
  },
  suggestionsContainer: {
    // Positioned absolutely right under search bar
    height: 40, // Reduced height from 50 to 40 for smaller chips
  },
  suggestionsWrapper: {
    alignItems: 'center', // Center the ScrollView horizontally
    justifyContent: 'center',
    paddingVertical: SUGGESTION_CONFIG.containerPaddingVertical,
  },
  suggestionsContent: {
    paddingHorizontal: SUGGESTION_CONFIG.containerPaddingHorizontal,
    alignItems: 'center',
  },
  suggestionChip: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: SUGGESTION_CONFIG.chipPaddingHorizontal,
    paddingVertical: SUGGESTION_CONFIG.chipPaddingVertical,
    borderRadius: SUGGESTION_CONFIG.chipBorderRadius,
    marginHorizontal: SUGGESTION_CONFIG.chipMarginHorizontal,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 }, // Reduced shadow
    shadowOpacity: 0.05, // Reduced shadow opacity
    shadowRadius: 4, // Reduced shadow radius
    elevation: 2, // Reduced elevation for Android
    // Add subtle hover effect for web
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    }),
  },
  suggestionText: {
    fontSize: SUGGESTION_CONFIG.fontSize,
    fontFamily: SUGGESTION_CONFIG.fontWeight,
    color: theme.colors.textSecondary,
  },
  bookmarkContainer: {
    position: 'absolute',
    bottom: 120, // Position above tab bar
    right: 24,
    zIndex: 20,
  },
  bookmarkButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bookmarkButtonSaved: {
    backgroundColor: theme.colors.text,
    borderColor: theme.colors.text,
  },
  resultsContainer: {
    // Positioned absolutely to be directly under search bar
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  cardsContainer: {
    width: '100%',
    paddingTop: 0, // No top padding since we're positioned right under search bar
  },
});