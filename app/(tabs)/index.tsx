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
import { Bookmark, Crown, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Adjust, AdjustEvent } from 'react-native-adjust';
import SearchBar from '@/components/SearchBar';
import DynamicLayoutEngine from '@/components/DynamicLayoutEngine';
import LoadingCard from '@/components/LoadingCard';
import { Search } from 'lucide-react-native';
import ErrorCard from '@/components/ErrorCard';
import { searchAllSources } from '@/services/api';
import { debounce } from '@/utils/debounce';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { SearchResultsService, GeneralSearchesService, SavedSearchesService } from '@/services/database';
import { useRouter } from 'expo-router';
import PremiumModal from '@/components/PremiumModal';
import AddCreditsModal from '@/components/AddCreditsModal';

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

const getFunLoadingMessage = () => {
  const messages = [
    "Searching the depths of the internet...",
    "Asking AI to be extra smart today...",
    "Gathering the finest content for you...",
    "Making sure we don't break the internet...",
    "Teaching AI to read your mind..."
  ];
  return messages[Math.floor(Math.random() * messages.length)];
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
  const { isPremium } = useSubscription();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isBookmarkSaved, setIsBookmarkSaved] = useState(false);
  const [searchCount, setSearchCount] = useState(0);
  const router = useRouter();
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countedSearches = useRef<Set<string>>(new Set());
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showAddCreditsModal, setShowAddCreditsModal] = useState(false);

  // Animation values
  const searchBarPosition = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const cardsTranslateY = useRef(new Animated.Value(screenHeight)).current;
  const cardsOpacity = useRef(new Animated.Value(0)).current;
  const suggestionsOpacity = useRef(new Animated.Value(1)).current;
  const bookmarkScale = useRef(new Animated.Value(0)).current;
  const bookmarkOpacity = useRef(new Animated.Value(0)).current;
  
  // Loading animation values
  const loadingProgress = useRef(new Animated.Value(0)).current;

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
    queryFn: () => searchAllSources(debouncedQuery, isPremium),
    enabled: debouncedQuery.length > 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error) => {
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Handle search results and increment count
  useEffect(() => {
    if (debouncedQuery && searchResults && user?.id && !countedSearches.current.has(debouncedQuery)) {
      // Clear any existing timer
      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
      }

      // Start a new timer
      searchTimer.current = setTimeout(async () => {
        console.log('🔍 Search viewed for 2 seconds, tracking search...');
        
        // Trigger haptic feedback when results are loaded
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        // Track search completion with Adjust
        const event = new AdjustEvent('27gu4x');
        event.addCallbackParameter('action', 'search_completed');
        event.addCallbackParameter('query_length', debouncedQuery.length.toString());
        Adjust.trackEvent(event);

        try {
          // Track in general_searches
          const generalSuccess = await GeneralSearchesService.trackSearch(user.id, debouncedQuery);
          
          // Increment search count in user_profiles
          const searchSuccess = await SearchResultsService.incrementSearchCount(user.id);
          
          if (generalSuccess && searchSuccess) {
            console.log('✅ Search tracked successfully in both tables');
            // Mark this search as counted
            countedSearches.current.add(debouncedQuery);
            // Refresh the search count
            loadSearchCount();
          } else {
            console.error('❌ Failed to track search in one or both tables');
          }
        } catch (error) {
          console.error('❌ Error tracking search:', error);
        }
      }, 2000); // 2 seconds delay
    }

    return () => {
      // Clear timer when search query or results change
      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
      }
    };
  }, [debouncedQuery, searchResults, user?.id]);

  // Check search limits for free users
  useEffect(() => {
    if (!isPremium && searchCount >= 10 && debouncedQuery) {
      setShowPremiumModal(true);
      setSearchQuery('');
      setDebouncedQuery('');
    }
  }, [searchCount, isPremium, debouncedQuery]);

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
    loadSearchCount();
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

  // Check if current search is saved
  useEffect(() => {
    const checkIfSaved = async () => {
      if (!user?.id || !debouncedQuery) {
        setIsBookmarkSaved(false);
        return;
      }

      try {
        const isSaved = await SavedSearchesService.isSearchSaved(user.id, debouncedQuery);
        setIsBookmarkSaved(isSaved);
      } catch (error) {
        console.error('Error checking if search is saved:', error);
        setIsBookmarkSaved(false);
      }
    };

    checkIfSaved();
  }, [debouncedQuery, user?.id]);

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

  const loadSearchCount = async () => {
    if (user?.id) {
      try {
        const count = await SearchResultsService.getSearchCount(user.id);
        setSearchCount(count);
      } catch (error) {
        console.error('Error loading search count:', error);
      }
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
    if (!searchResults || !debouncedQuery || !user?.id) return;

    try {
      const success = await SavedSearchesService.saveSearch(user.id, debouncedQuery, {
        gemini: searchResults.gemini,
        tiktok: searchResults.tiktok,
        reddit: searchResults.reddit,
      });

      if (success) {
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
      } else {
        Alert.alert('Error', 'Failed to save search');
      }
    } catch (error) {
      console.error('Error saving bookmark:', error);
      Alert.alert('Error', 'Failed to save search');
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

  const handleUpgrade = () => {
    setShowPremiumModal(false);
    router.push('/(auth)/upgrade' as any);
  };

  // Start loading animations
  useEffect(() => {
    if (isLoading) {


      // Loading bar animation
      const barAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(loadingProgress, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(loadingProgress, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ])
      );



      // Start all animations
      barAnimation.start();

      return () => {
        barAnimation.stop();
      };
    }
  }, [isLoading]);

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

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      countedSearches.current.clear();
      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
      }
    };
  }, []);

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
          <View style={styles.headerTop}>
            {isPremium ? (
              <Text style={styles.premiumText}>PREMIUM</Text>
            ) : (
              <>
                <View style={styles.searchCounter}>
                  <Text style={styles.searchCounterText}>
                                          {Math.max(0, 10 - searchCount)} Searches Left
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.addCreditsButton}
                  onPress={() => {
                    // Track Add Credits button click with Adjust
                    const event = new AdjustEvent('reecpr');
                    event.addCallbackParameter('action', 'add_credits_clicked');
                    event.addCallbackParameter('user_type', isPremium ? 'premium' : 'free');
                    Adjust.trackEvent(event);
                    
                    setShowAddCreditsModal(true);
                  }}
                >
                  <Plus size={16} color={theme.colors.textSecondary} strokeWidth={2} />
                  <Text style={styles.addCreditsText}>Add Searches</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          <Image
            source={isDark ? require('@/assets/images/logo in dark.png') : require('@/assets/images/logo in light.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          {user && (
            <Text style={styles.welcomeText}>
               search, but better
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
              <View style={{ width: '100%', marginTop: 12 }}>
                {isLoading ? (
                  <View style={styles.loadingScreenContainer}>
                    <View style={styles.loadingContent}>
                      {/* Animated Loading Bar */}
                      <View style={styles.loadingBarContainer}>
                        <Animated.View 
                          style={[
                            styles.loadingBar, 
                            { 
                              width: loadingProgress.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0%', '100%']
                              })
                            }
                          ]} 
                        >
                          <LinearGradient
                            colors={['#FF8FA3', '#4A90E2']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.loadingBarGradient}
                          />
                        </Animated.View>
                      </View>
                      
                      {/* Fun Loading Text */}
                      <Text style={styles.loadingTitle}>Searching Navo</Text>
                      <Text style={styles.loadingSubtitle}>{getFunLoadingMessage()}</Text>
                      

                    </View>
                  </View>
                ) : error ? (
                  <ErrorCard
                    title="Search Error"
                    message={error.message}
                    onRetry={handleRetry}
                  />
                ) : searchResults ? (
                  <DynamicLayoutEngine
                    searchResults={searchResults}
                    query={debouncedQuery}
                    onRetry={handleRetry}
                    isLoading={isLoading}
                  />
                ) : null}
              </View>
            </ScrollView>
          </Animated.View>
        )}
      </SafeAreaView>

      <PremiumModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onUpgrade={handleUpgrade}
      />
      
      <AddCreditsModal
        visible={showAddCreditsModal}
        onClose={() => setShowAddCreditsModal(false)}
      />
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
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
    bottom: 140, // Position above tab bar
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
  searchCounter: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  searchCounterText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
  },
  addCreditsButton: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addCreditsText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },

  loadingScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  loadingIconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBarContainer: {
    width: 200,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    marginTop: 40,
    marginBottom: 20,
    overflow: 'hidden',
  },
  loadingBar: {
    height: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingBarGradient: {
    width: '100%',
    height: '100%',
  },
  loadingTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  floatingStarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  floatingStar: {
    opacity: 0.7,
  },
  floatingStarImage: {
    width: 24,
    height: 24,
  },
  assetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  assetItem: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starAsset: {
    width: 48,
    height: 48,
  },
  magnifyingAsset: {
    width: 64,
    height: 64,
  },
  funText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});