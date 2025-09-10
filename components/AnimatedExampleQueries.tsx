import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { Play, MessageSquare, Users, ChevronDown, Sparkles, Search } from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');

// Function to get relevant TikTok thumbnails
const getTikTokThumbnail = (title: string) => {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('workout') || titleLower.includes('fitness')) {
    return 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop&crop=center';
  } else if (titleLower.includes('pancake') || titleLower.includes('breakfast') || titleLower.includes('protein')) {
    return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=600&fit=crop&crop=center';
  } else if (titleLower.includes('japan') || titleLower.includes('travel') || titleLower.includes('hidden')) {
    return 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=600&fit=crop&crop=center';
  } else {
    return 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400&h=600&fit=crop&crop=center';
  }
};

// Mock three TikTok items with distinct images and meta, relevant to the query
const getTikTokMockItems = (query: string) => {
  const q = query.toLowerCase();

  if (q.includes('workout') || q.includes('fitness') || q.includes('gym') || q.includes('exercise')) {
    return [
      {
        title: 'Full-Body HIIT at Home',
        username: '@fitfuel',
        views: '1.2M',
        thumb: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=600&fit=crop&crop=center',
      },
      {
        title: 'Dumbbell Only Routine',
        username: '@strengthlab',
        views: '942K',
        thumb: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=600&fit=crop&crop=center',
      },
      {
        title: '10-Minute Mobility Flow',
        username: '@movewell',
        views: '587K',
        thumb: 'https://images.unsplash.com/photo-1579751626657-72bc17010498?w=400&h=600&fit=crop&crop=center',
      },
    ];
  }

  if (q.includes('breakfast') || q.includes('recipe') || q.includes('pancake') || q.includes('food')) {
    return [
      {
        title: '3-Ingredient Protein Pancakes',
        username: '@healthychef',
        views: '850K',
        thumb: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=400&h=600&fit=crop&crop=center',
      },
      {
        title: 'Overnight Oats 5 Ways',
        username: '@mealprepco',
        views: '1.1M',
        thumb: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=600&fit=crop&crop=center',
      },
      {
        title: 'High-Protein Smoothies',
        username: '@blendbar',
        views: '623K',
        thumb: 'https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?w=400&h=600&fit=crop&crop=center',
      },
    ];
  }

  if (q.includes('travel') || q.includes('destination') || q.includes('japan') || q.includes('itinerary')) {
    return [
      {
        title: 'Hidden Gems in Japan',
        username: '@wanderlust',
        views: '1.8M',
        thumb: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=600&fit=crop&crop=center',
      },
      {
        title: 'Europe on a Budget',
        username: '@backpackdaily',
        views: '974K',
        thumb: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400&h=600&fit=crop&crop=center',
      },
      {
        title: 'Island Hopping Guide',
        username: '@seabreeze',
        views: '712K',
        thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=600&fit=crop&crop=center',
      },
    ];
  }

  // General/tech default
  return [
    {
      title: 'Productivity Hacks That Work',
      username: '@focuslab',
      views: '992K',
      thumb: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=600&fit=crop&crop=center',
    },
    {
      title: 'Learn React in 60 Seconds',
      username: '@devsnacks',
      views: '1.5M',
      thumb: 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=400&h=600&fit=crop&crop=center',
    },
    {
      title: 'Desk Setup Makeover',
      username: '@workspace',
      views: '648K',
      thumb: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=600&fit=crop&crop=center',
    },
  ];
};

interface ExampleQuery {
  query: string;
  outputs: {
    type: 'tiktok' | 'reddit' | 'ai';
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    color: string;
  }[];
}

const exampleQueries: ExampleQuery[] = [
  {
    query: "best workout routines",
    outputs: [
      {
        type: 'ai',
        title: 'Personalized Workout Plan...',
        subtitle: 'AI-generated routine based on your goals...',
        icon: <Sparkles size={12} color="#FFFFFF" />,
        color: '#4A90E2'
      },
      {
        type: 'tiktok',
        title: '5-Minute Morning Workout',
        subtitle: '2.3M views • @fitnessguru',
        icon: <Play size={12} color="#FFFFFF" />,
        color: '#FF0050'
      },
      {
        type: 'reddit',
        title: 'r/fitness - Beginner Routine Guide',
        subtitle: '1.2k upvotes • 3 days ago',
        icon: <Users size={12} color="#FFFFFF" />,
        color: '#FF4500'
      }
    ]
  },
  {
    query: "healthy breakfast ideas",
    outputs: [
      {
        type: 'ai',
        title: 'Nutritional Analysis & Tips...',
        subtitle: 'AI-powered meal planning suggestions...',
        icon: <Sparkles size={12} color="#FFFFFF" />,
        color: '#4A90E2'
      },
      {
        type: 'tiktok',
        title: '3-Ingredient Protein Pancakes',
        subtitle: '850K views • @healthychef',
        icon: <Play size={12} color="#FFFFFF" />,
        color: '#FF0050'
      },
      {
        type: 'reddit',
        title: 'r/nutrition - Breakfast Recipes',
        subtitle: '456 upvotes • 1 day ago',
        icon: <Users size={12} color="#FFFFFF" />,
        color: '#FF4500'
      }
    ]
  },
  {
    query: "travel destinations 2024",
    outputs: [
      {
        type: 'ai',
        title: 'Personalized Travel Itinerary...',
        subtitle: 'AI-curated recommendations for your budget...',
        icon: <Sparkles size={12} color="#FFFFFF" />,
        color: '#4A90E2'
      },
      {
        type: 'tiktok',
        title: 'Hidden Gems in Japan',
        subtitle: '1.8M views • @wanderlust',
        icon: <Play size={12} color="#FFFFFF" />,
        color: '#FF0050'
      },
      {
        type: 'reddit',
        title: 'r/travel - Best Places to Visit',
        subtitle: '2.1k upvotes • 5 days ago',
        icon: <Users size={12} color="#FFFFFF" />,
        color: '#FF4500'
      }
    ]
  }
];

interface AnimatedExampleQueriesProps {
  onQueryPress?: (query: string) => void;
}

export default function AnimatedExampleQueries({ onQueryPress }: AnimatedExampleQueriesProps) {
  const { theme, isDark } = useTheme();
  const [currentQueryIndex, setCurrentQueryIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [showOutputs, setShowOutputs] = useState(false);
  const [visibleOutputs, setVisibleOutputs] = useState<number[]>([]);
  
    const typingAnimation = useRef(new Animated.Value(0)).current;
  const cursorOpacity = useRef(new Animated.Value(1)).current;
  const hintOpacity = useRef(new Animated.Value(1)).current;

  // Perplexity typing state
  const [aiTitleDisplayed, setAiTitleDisplayed] = useState('');
  const [aiSubtitleDisplayed, setAiSubtitleDisplayed] = useState('');
  const aiTypingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const aiTypingStartedRef = useRef<{ queryIndex: number | null; started: boolean }>({ queryIndex: null, started: false });

  // TikTok gentle swipe animation
  const tiktokSwipe = useRef(new Animated.Value(0)).current; // range [-1, 1]
  const tiktokSwipeLoop = useRef<Animated.CompositeAnimation | null>(null);

  // Create individual animation values for each output
  const outputAnimations = useRef(
    Array.from({ length: 3 }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(20),
    }))
  ).current;

  const currentQuery = exampleQueries[currentQueryIndex];

    // Typing animation
  useEffect(() => {
    const typeText = async () => {
      setIsTyping(true);
      setDisplayedText('');
      setShowOutputs(false);
      setVisibleOutputs([]);

      // Keep hint text visible during typing
      hintOpacity.setValue(1);

      // Reset animations
      typingAnimation.setValue(0);
      outputAnimations.forEach(anim => {
        anim.opacity.setValue(0);
        anim.translateY.setValue(20);
      });

      // Small delay to ensure clean reset
      await new Promise(resolve => setTimeout(resolve, 100));

      // Type the query character by character
      for (let i = 0; i <= currentQuery.query.length; i++) {
        setDisplayedText(currentQuery.query.slice(0, i));
        await new Promise(resolve => setTimeout(resolve, 80));
      }

      // Show outputs after typing is complete
      setTimeout(() => {
        setShowOutputs(true);
        setIsTyping(false);

        // Fade out hint text when results start showing
        Animated.timing(hintOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();

        // Show outputs one by one with 800ms delay between each
        currentQuery.outputs.forEach((_, index) => {
          setTimeout(() => {
            setVisibleOutputs(prev => [...prev, index]);
            // Animate the specific output when it becomes visible
            Animated.parallel([
              Animated.timing(outputAnimations[index].opacity, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
              }),
              Animated.timing(outputAnimations[index].translateY, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
              }),
            ]).start();
          }, index * 400); // 400ms delay between each output
        });

        // Keep hint text hidden after results are shown
      }, 1200);
    };

    typeText();
  }, [currentQueryIndex]);

  // Cursor blinking animation
  useEffect(() => {
    const blinkAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(cursorOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    
    if (isTyping) {
      blinkAnimation.start();
    } else {
      blinkAnimation.stop();
      cursorOpacity.setValue(1);
    }

    return () => blinkAnimation.stop();
  }, [isTyping]);

  // Cycle through queries
  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out all visible outputs first
      if (visibleOutputs.length > 0) {
        const fadeOutPromises = visibleOutputs.map((index) => {
          return new Promise<void>((resolve) => {
            Animated.timing(outputAnimations[index].opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }).start(() => resolve());
          });
        });

        // Wait for all fade outs to complete, then change query
        Promise.all(fadeOutPromises).then(() => {
          setCurrentQueryIndex((prev) => (prev + 1) % exampleQueries.length);
        });
      } else {
        // If no outputs are visible, just change query immediately
        setCurrentQueryIndex((prev) => (prev + 1) % exampleQueries.length);
      }
    }, 6000); // Change every 6 seconds (typing + 3 outputs × 800ms + buffer)

    return () => clearInterval(interval);
  }, [visibleOutputs]);

  // Start Perplexity typing when its card appears (only once per query)
  useEffect(() => {
    const aiIndex = currentQuery.outputs.findIndex(o => o.type === 'ai');

    // Reset state when query changes
    if (aiTypingStartedRef.current.queryIndex !== currentQueryIndex) {
      aiTypingTimers.current.forEach(t => clearTimeout(t));
      aiTypingTimers.current = [];
      aiTypingStartedRef.current = { queryIndex: currentQueryIndex, started: false };
      setAiTitleDisplayed('');
      setAiSubtitleDisplayed('');
    }

    if (aiIndex !== -1 && visibleOutputs.includes(aiIndex) && !aiTypingStartedRef.current.started) {
      aiTypingStartedRef.current.started = true;
      const title = currentQuery.outputs[aiIndex].title;
      const subtitle = currentQuery.outputs[aiIndex].subtitle;

      for (let i = 0; i <= title.length; i++) {
        const timer = setTimeout(() => {
          setAiTitleDisplayed(title.slice(0, i));
        }, i * 35);
        aiTypingTimers.current.push(timer);
      }

      const subtitleStartDelay = title.length * 35 + 200;
      for (let i = 0; i <= subtitle.length; i++) {
        const timer = setTimeout(() => {
          setAiSubtitleDisplayed(subtitle.slice(0, i));
        }, subtitleStartDelay + i * 25);
        aiTypingTimers.current.push(timer);
      }
    }
  }, [visibleOutputs, currentQueryIndex]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      aiTypingTimers.current.forEach(t => clearTimeout(t));
      aiTypingTimers.current = [];
    };
  }, []);

  // Start/stop TikTok gentle swipe when its card appears
  useEffect(() => {
    const tikIndex = currentQuery.outputs.findIndex(o => o.type === 'tiktok');
    if (tikIndex !== -1 && visibleOutputs.includes(tikIndex)) {
      if (!tiktokSwipeLoop.current) {
        tiktokSwipeLoop.current = Animated.loop(
          Animated.sequence([
            Animated.timing(tiktokSwipe, {
              toValue: -1,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(tiktokSwipe, {
              toValue: 1,
              duration: 2400,
              useNativeDriver: true,
            }),
            Animated.timing(tiktokSwipe, {
              toValue: 0,
              duration: 1200,
              useNativeDriver: true,
            }),
          ])
        );
        tiktokSwipeLoop.current.start();
      }
    } else {
      if (tiktokSwipeLoop.current) {
        tiktokSwipeLoop.current.stop();
        tiktokSwipeLoop.current = null;
      }
      tiktokSwipe.setValue(0);
    }
    return () => {
      if (tiktokSwipeLoop.current) {
        tiktokSwipeLoop.current.stop();
        tiktokSwipeLoop.current = null;
      }
      tiktokSwipe.setValue(0);
    };
  }, [visibleOutputs, currentQueryIndex]);

  const handleQueryPress = () => {
    if (onQueryPress) {
      // Only fill the search value; parent will expand AnimatedSearchBar and wait for submit
      onQueryPress(currentQuery.query);
    }
  };

  const styles = createStyles(theme, isDark);

  return (
    <View style={styles.container}>
      {/* Query Display */}
      <TouchableOpacity 
        style={styles.queryContainer}
        onPress={handleQueryPress}
        activeOpacity={0.8}
      >
        <View style={styles.queryBox}>
          <Text style={styles.queryText}>
            {displayedText}
            {isTyping && (
              <Animated.Text style={[styles.cursor, { opacity: cursorOpacity }]}>
                |
              </Animated.Text>
            )}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Output Examples */}
      {showOutputs && (
        <View style={styles.outputsContainer}>
          {currentQuery.outputs.map((output, index) => {
            if (!visibleOutputs.includes(index)) return null;
            
            return (
              <Animated.View
                key={index}
                style={[
                  styles.outputCard,
                  {
                    opacity: outputAnimations[index].opacity,
                    transform: [{ translateY: outputAnimations[index].translateY }],
                  }
                ]}
              >
                {output.type === 'ai' ? (
                  <View style={styles.perplexityCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.headerLeft}>
                        <Image 
                          source={require('@/assets/images/blue.png')} 
                          style={styles.perplexityLogo}
                        />
                        <Text style={styles.googleLabel}>Perplexity</Text>
                      </View>
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={styles.mainAnswer} numberOfLines={3}>
                        {aiTitleDisplayed || output.title}
                      </Text>
                      <Text style={styles.summaryText}>
                        {aiSubtitleDisplayed || output.subtitle}
                      </Text>
                    </View>
                  </View>
                ) : output.type === 'tiktok' ? (
                  <View style={styles.tiktokCard}>
                    <View style={styles.tiktokHeader}>
                      <Image 
                        source={require('@/assets/images/tiktok.png')} 
                        style={styles.tiktokLogo}
                        resizeMode="contain"
                      />
                      <Text style={styles.tiktokHeaderTitle}>TikTok</Text>
                    </View>
                    <Animated.View style={[
                      styles.tiktokGridRow,
                      { transform: [{ translateX: tiktokSwipe.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] }) }] }
                    ]}>
                      {getTikTokMockItems(output.title).map((item, i) => (
                        <View style={styles.tiktokGridItem} key={i}>
                          <Image 
                            source={{ uri: item.thumb }}
                            style={styles.tiktokGridThumb}
                            resizeMode="cover"
                          />
                          <View style={styles.tiktokGridOverlay}>
                            <Play size={16} color="#FFFFFF" fill="#FFFFFF" strokeWidth={2} />
                          </View>
                          <View style={styles.tiktokGridInfoOverlay}>
                            <Text style={styles.tiktokGridTitle} numberOfLines={1}>{item.title}</Text>
                            <Text style={styles.tiktokGridMeta}>{item.views} views • {item.username}</Text>
                          </View>
                        </View>
                      ))}
                    </Animated.View>
                  </View>
                ) : (
                  <View style={styles.redditCard}>
                    <View style={styles.redditHeader}>
                      <Image 
                        source={require('@/assets/images/Reddit_Logo.png')} 
                        style={styles.redditLogo}
                        resizeMode="contain"
                      />
                      <Text style={styles.redditHeaderTitle}>Reddit</Text>
                    </View>
                    <View style={styles.redditPostHeader}>
                      <Text style={styles.redditSubreddit}>r/{output.title.split(' - ')[0]}</Text>
                      <Text style={styles.redditTime}>3 days ago</Text>
                    </View>
                    <Text style={styles.redditTitle} numberOfLines={2}>
                      {output.title.split(' - ')[1] || output.title}
                    </Text>
                    <View style={styles.redditStats}>
                      <View style={styles.redditStatItem}>
                        <ChevronDown size={12} color="#9A9CA9" strokeWidth={1.26} />
                        <Text style={styles.redditStatText}>1.2k</Text>
                      </View>
                      <View style={styles.redditStatItem}>
                        <ChevronDown size={12} color="#9A9CA9" strokeWidth={1.26} />
                        <Text style={styles.redditStatText}>45</Text>
                      </View>
                    </View>
                  </View>
                )}
              </Animated.View>
            );
          })}
        </View>
      )}

                        {/* Hint Text */}
                  <Animated.View style={[styles.hintContainer, { opacity: hintOpacity }]}>
                    <Text style={styles.hintText}>
                      Tap the search{' '}
                    </Text>
                    <Search size={12} color={theme.colors.textSecondary} strokeWidth={2} />
                    <Text style={styles.hintText}>
                      {' '}to start searching
                    </Text>
                  </Animated.View>
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 20,
  },
  queryContainer: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 24,
  },
  queryBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 48,
    justifyContent: 'center',
  },
  queryText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: theme.colors.text,
    lineHeight: 20,
    textAlign: 'center',
  },
  cursor: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  outputsContainer: {
    width: '100%',
    maxWidth: 340,
    marginBottom: 16,
    opacity: 0.8,
  },
  outputCard: {
    marginBottom: 8,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  // TikTok Card Styles
  tiktokCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    overflow: 'hidden',
  },
  tiktokHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 3,
    gap: 4,
  },
  tiktokLogo: {
    width: 16,
    height: 16,
  },
  tiktokHeaderTitle: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
  },
  tiktokVideoContainer: {
    height: 100,
    backgroundColor: '#000000',
    position: 'relative',
    overflow: 'hidden',
  },
  tiktokGridRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingBottom: 6,
  },
  tiktokGridItem: {
    flex: 1,
    aspectRatio: 9/14,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#000000',
    position: 'relative',
  },
  tiktokGridThumb: {
    width: '100%',
    height: '100%',
  },
  tiktokGridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)'
  },
  tiktokGridInfoOverlay: {
    position: 'absolute',
    left: 6,
    right: 6,
    bottom: 6,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  tiktokGridTitle: {
    fontSize: 9,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  tiktokGridMeta: {
    fontSize: 8,
    fontFamily: 'Inter-Regular',
    color: '#E5E7EB',
  },
  tiktokThumbnail: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  tiktokVideoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  tiktokVideoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tiktokInfo: {
    padding: 12,
  },
  tiktokTitle: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginBottom: 2,
  },
  tiktokSubtitle: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
  },
  // Reddit Card Styles
  redditCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    overflow: 'hidden',
  },
  redditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 3,
    gap: 4,
  },
  redditLogo: {
    width: 16,
    height: 16,
  },
  redditHeaderTitle: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
  },
  redditPostHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 4,
  },
  redditSubreddit: {
    fontSize: 9,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
  },
  redditTime: {
    fontSize: 9,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
  },
  redditTitle: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginBottom: 8,
    lineHeight: 15,
    paddingHorizontal: 10,
  },
  redditStats: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  redditStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  redditStatText: {
    fontSize: 9,
    fontFamily: 'Inter-Regular',
    color: '#9A9CA9',
  },
  // Perplexity Card Styles (matching GeminiSection)
  perplexityCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    padding: 8,
    gap: 10,
    width: '100%',
    minHeight: 100,
    backgroundColor: isDark ? 'rgba(33, 33, 33, 0.32)' : 'rgba(255, 255, 255, 0.95)',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.25 : 0.15,
    shadowRadius: 39.1,
    borderRadius: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  perplexityLogo: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  googleLabel: {
    color: isDark ? '#FFFFFF' : '#000000',
    fontSize: 12,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  sourceIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(156, 163, 175, 0.1)' : 'rgba(0, 0, 0, 0.1)',
  },
  cardContent: {
    width: '100%',
    paddingHorizontal: 8,
    flex: 1,
  },
  mainAnswer: {
    fontSize: 13,
    fontWeight: '600',
    color: isDark ? '#FFFFFF' : '#000000',
    lineHeight: 17,
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 11,
    color: isDark ? '#9CA3AF' : '#6B7280',
    lineHeight: 15,
    marginBottom: 8,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  hintText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});