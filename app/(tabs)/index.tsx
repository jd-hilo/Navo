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
import { Bookmark, Crown, Plus, Settings } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Adjust, AdjustEvent } from 'react-native-adjust';
import AnimatedSearchBar from '../../components/AnimatedSearchBar';
import { FilterType } from '../../components/FilterBar';
import DynamicLayoutEngine from '@/components/DynamicLayoutEngine';
import LoadingCard from '@/components/LoadingCard';
import { Search, Play, Users, Globe } from 'lucide-react-native';
import ErrorCard from '@/components/ErrorCard';
import AnimatedExampleQueries from '@/components/AnimatedExampleQueries';
import { searchAllSources } from '@/services/api';
import { debounce } from '@/utils/debounce';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { SearchResultsService, GeneralSearchesService, SavedSearchesService } from '@/services/database';
import { useRouter } from 'expo-router';
import PremiumModal from '@/components/PremiumModal';
import SavedSearchesModal from '@/components/SavedSearchesModal';

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
  const [showSavedSearchesModal, setShowSavedSearchesModal] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [isSearchBarExpanded, setIsSearchBarExpanded] = useState(false);
  const router = useRouter();
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countedSearches = useRef<Set<string>>(new Set());
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [scanTikTokCount, setScanTikTokCount] = useState(0);
  const [scanRedditCount, setScanRedditCount] = useState(0);
  const [scanWebPercent, setScanWebPercent] = useState(0);

  // Animation values
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const cardsTranslateY = useRef(new Animated.Value(screenHeight)).current;
  const cardsOpacity = useRef(new Animated.Value(0)).current;
  const bookmarkScale = useRef(new Animated.Value(0)).current;
  const bookmarkOpacity = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  
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
    queryFn: () => {
      console.log('🚀 Starting new search for:', debouncedQuery);
      return searchAllSources(debouncedQuery, isPremium);
    },
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

  // Only search on submit; when cleared, reset state and animations
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setDebouncedQuery('');
      setHasSearched(false);
      // Force reset to initial mode to ensure header/logo reappear
      headerOpacity.stopAnimation();
      cardsOpacity.stopAnimation();
      cardsTranslateY.stopAnimation();
      Animated.parallel([
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(cardsTranslateY, {
          toValue: screenHeight,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(cardsOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [searchQuery]);

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
    loadSearchCount();
  }, []);

  // Logo fade-in animation on mount
  useEffect(() => {
    Animated.timing(logoOpacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
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
    // Show cards immediately when search starts
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 0,
        duration: 400,
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
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 400,
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
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
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



  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleSuggestionPress = (suggestion: string) => {
    // Fill the search bar and expand it; do NOT start searching yet
    setSearchQuery(suggestion);
    // Ensure results are hidden until user submits
    setHasSearched(false);
    setDebouncedQuery('');
    animateToInitialMode();
  };

  const handleSubmitSearch = (query: string) => {
    const trimmed = (query || '').trim();
    if (trimmed.length > 2) {
      setSearchQuery(trimmed);
      setDebouncedQuery(trimmed); // trigger actual search
      if (!hasSearched) {
        setHasSearched(true);
      }
      animateToSearchMode();
    }
  };

  const handleUpgrade = () => {
    setShowPremiumModal(false);
    router.push('/(auth)/upgrade' as any);
  };

  const handleSearchBarExpandedChange = (expanded: boolean) => {
    setIsSearchBarExpanded(expanded);
  };

  // Ensure header/logo reliably return when search is closed or cleared
  useEffect(() => {
    const noActiveQuery = !debouncedQuery || debouncedQuery.length === 0;
    if (!isSearchBarExpanded && noActiveQuery && !hasSearched) {
      // Stop any ongoing animations and reset to initial state
      headerOpacity.stopAnimation();
      cardsOpacity.stopAnimation();
      cardsTranslateY.stopAnimation();
      Animated.parallel([
        Animated.timing(headerOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(cardsTranslateY, { toValue: screenHeight, duration: 200, useNativeDriver: true }),
        Animated.timing(cardsOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [isSearchBarExpanded, debouncedQuery, hasSearched, headerOpacity, cardsOpacity, cardsTranslateY]);

  // Filter search results based on current filter
  const getFilteredResults = () => {
    if (!searchResults) return null;
    
    console.log('🔍 Filtering results for:', currentFilter, 'Query:', debouncedQuery);
    
    if (currentFilter === 'all') {
      return searchResults;
    }
    
    const filteredResults: any = {};
    
    switch (currentFilter) {
      case 'ai':
        if (searchResults.gemini) {
          filteredResults.gemini = searchResults.gemini;
        }
        break;
      case 'tiktok':
        if (searchResults.tiktok) {
          filteredResults.tiktok = searchResults.tiktok;
        }
        break;
      case 'reddit':
        if (searchResults.reddit) {
          filteredResults.reddit = searchResults.reddit;
        }
        break;
      case 'pinterest':
        if (searchResults.pinterest) {
          filteredResults.pinterest = searchResults.pinterest;
        }
        break;
    }
    
    console.log('✅ Filtered results:', Object.keys(filteredResults));
    return filteredResults;
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

      // Initialize mock scan counters
      setScanTikTokCount(Math.floor(Math.random() * 12) + 8); // 8-19
      setScanRedditCount(Math.floor(Math.random() * 10) + 6); // 6-15
      setScanWebPercent(Math.floor(Math.random() * 15) + 10); // 10-24

      const tiktokInterval = setInterval(() => {
        setScanTikTokCount((v) => (v < 100 ? v + 1 : 100));
      }, 60);
      const redditInterval = setInterval(() => {
        setScanRedditCount((v) => (v < 100 ? v + 1 : 100));
      }, 75);
      const webInterval = setInterval(() => {
        setScanWebPercent((v) => (v < 100 ? v + 1 : 100));
      }, 50);

      // Start animations
      barAnimation.start();

      return () => {
        barAnimation.stop();
        clearInterval(tiktokInterval);
        clearInterval(redditInterval);
        clearInterval(webInterval);
      };
    }
  }, [isLoading]);

  const styles = createStyles(theme);

  // Calculate cards width and positioning
  const cardsWidth = Math.min(screenWidth * 0.92, 400); // Cards are 92% of screen
  const cardsLeftMargin = (screenWidth - cardsWidth) / 2;

  // Calculate the results container position
  const resultsTranslateY = cardsTranslateY.interpolate({
    inputRange: [0, 1],
    outputRange: [screenHeight, 100], // Fixed position from top
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
                    (Platform.OS === 'web' ? 20 : 60) + 48 + 2 &&
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
              <TouchableOpacity style={styles.searchCounter} onPress={() => setShowPremiumModal(true)}>
                <View style={styles.searchCounterContent}>
                  <View style={styles.infoIconContainer}>
                    <Text style={styles.infoIcon}>i</Text>
                  </View>
                  <Text style={styles.searchCounterText}>
                    {Math.max(0, 10 - searchCount)} searches left
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
          <Animated.Image
            source={isDark ? require('@/assets/images/logo in dark.png') : require('@/assets/images/logo in light.png')}
            style={[styles.logo, { opacity: logoOpacity }]}
            resizeMode="contain"
          />

        </Animated.View>

        {/* Animated Example Queries - Only show when no search and search bar is not expanded */}
        {!hasSearched && !isSearchBarExpanded && (
          <AnimatedExampleQueries 
            onQueryPress={handleSuggestionPress}
          />
        )}

        {/* Save Search Button - Above Search Bar */}
        <Animated.View
          style={[
            styles.bookmarkContainer,
            {
              opacity: bookmarkOpacity,
              transform: [{ scale: bookmarkScale }],
              position: 'absolute',
              bottom: 120, // Position above search bar
              right: 20,
              zIndex: 10,
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

        {/* Bottom Center Search Bar */}
        <AnimatedSearchBar
          value={searchQuery}
          onValueChange={setSearchQuery}
          onSearch={handleSubmitSearch}
          placeholder="Create a search for..."
          onFilterChange={setCurrentFilter}
          currentFilter={currentFilter}
          showFilters={hasSearched && searchResults && Object.keys(searchResults).length > 0}
          onExpandedChange={handleSearchBarExpandedChange}
        />

        {/* Bottom Navigation Icons */}
        <View style={styles.bottomNavigation}>
          {/* Bookmark Icon - Bottom Left */}
          <TouchableOpacity
            style={styles.bottomIcon}
            onPress={() => router.push('/saved' as any)}
            activeOpacity={0.7}
          >
            <Bookmark size={24} color={theme.colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>

          {/* Settings Icon - Bottom Right */}
          <TouchableOpacity
            style={styles.bottomIcon}
            onPress={() => router.push('/(tabs)/settings' as any)}
            activeOpacity={0.7}
          >
            <Settings size={24} color={theme.colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        </View>





        {/* Results Container - Absolutely positioned under search bar */}
        {hasSearched && (
          <Animated.View
            style={{
              position: 'absolute',
              top: 80, // Fixed position from top
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
                { paddingBottom: 120, alignItems: 'center' } // Reduced padding since no tab bar
              ]}
            >
              <View style={{ width: '100%', marginTop: currentFilter === 'all' ? 35 : 15 }}>
                {isLoading ? (
                  <View style={styles.loadingScreenContainer}>
                    <View style={styles.loadingContent}>
                      <View style={styles.loadingCard}>
                        <Text style={styles.loadingTitle}>Scanning sources</Text>
                        <Text style={styles.loadingSubtitle}>Finding the best results for “{debouncedQuery}”</Text>

                        <View style={styles.loadingStatRow}>
                          <View style={styles.loadingStatLeft}>
                            <Play size={14} color={theme.colors.textSecondary} strokeWidth={2} />
                            <Text style={styles.loadingStatText}>Analyzing TikToks</Text>
                          </View>
                          <Text style={styles.loadingStatValue}>{scanTikTokCount} / 100</Text>
                        </View>

                        <View style={styles.loadingStatRow}>
                          <View style={styles.loadingStatLeft}>
                            <Users size={14} color={theme.colors.textSecondary} strokeWidth={2} />
                            <Text style={styles.loadingStatText}>Reading Reddit threads</Text>
                          </View>
                          <Text style={styles.loadingStatValue}>{scanRedditCount} / 100</Text>
                        </View>

                        <View style={styles.loadingStatRow}>
                          <View style={styles.loadingStatLeft}>
                            <Globe size={14} color={theme.colors.textSecondary} strokeWidth={2} />
                            <Text style={styles.loadingStatText}>Scanning the web</Text>
                          </View>
                          <Text style={styles.loadingStatValue}>{scanWebPercent}%</Text>
                        </View>

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
                              colors={['#00C0C8', '#E3538D', '#F2A403']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={styles.loadingBarGradient}
                            />
                          </Animated.View>
                        </View>
                      </View>
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
                    searchResults={getFilteredResults()}
                    query={debouncedQuery}
                    onRetry={handleRetry}
                    isLoading={isLoading}
            showAIOptimizedLayout={currentFilter === 'all'}
            enableFollowUpChat={currentFilter === 'ai'}
            enableTikTokSuggestions={currentFilter === 'tiktok'}
            enableRedditSuggestions={currentFilter === 'reddit'}
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
      
      {/* SavedSearchesModal removed in favor of dedicated screen */}
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
    paddingTop: Platform.OS === 'web' ? 60 : 40,
    paddingHorizontal: 32,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
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

  bookmarkContainer: {
    position: 'absolute',
    bottom: 40, // Position at bottom right
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
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 4,
    paddingHorizontal: 8,
    gap: 4,
    width: 160,
    height: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.32)',
    borderRadius: 42,
    marginLeft: 8,
    maxWidth: '90%',
  },
  searchCounterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '100%',
  },
  infoIconContainer: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 0.875,
    borderColor: '#808080',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoIcon: {
    color: '#808080',
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  searchCounterText: {
    flex: 1,
    height: 15,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 15,
    textAlign: 'center',
    color: '#808080',
    marginTop: -2,
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
  bottomNavigation: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    zIndex: 10,
  },
  bottomIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
  loadingCard: {
    width: Math.min(screenWidth * 0.9, 360),
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  loadingBrand: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  loadingBrandLogo: {
    width: 110,
    height: 32,
    opacity: 0.95,
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
    marginTop: 16,
    marginBottom: 0,
    overflow: 'hidden',
  },
  loadingBar: {
    height: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  loadingStatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingStatText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
  },
  loadingStatValue: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
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
    textAlign: 'left',
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