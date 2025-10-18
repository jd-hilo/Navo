import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ArrowLeft, Trash2, Folder } from 'lucide-react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  getSavedContent,
  deleteSavedContent,
  Folder as FolderType,
  SavedContentWithFolder 
} from '../../services/api';
import { SavedContentCard } from '../../components/SavedContentCard';
import FilterBar, { FilterType } from '../../components/FilterBar';
import FolderContentItem from '../../components/FolderContentItem';
import TikTokModal from '../../components/modals/TikTokModal';
import RedditModal from '../../components/modals/RedditModal';
import PinterestModal from '../../components/modals/PinterestModal';
import GeminiSection from '../../components/GeminiSection';

export default function FolderContentScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const { folderId, folderName, folderColor } = useLocalSearchParams();
  
  const [content, setContent] = useState<SavedContentWithFolder[]>([]);
  const [filtered, setFiltered] = useState<SavedContentWithFolder[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SavedContentWithFolder | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [expandedAiId, setExpandedAiId] = useState<string | null>(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Setup animations
  useEffect(() => {
    const fadeInAnimation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    fadeInAnimation.start();
  }, []);

  const loadContent = async () => {
    try {
      setIsLoading(true);
      const savedContent = await getSavedContent(folderId as string);
      setContent(savedContent);
    } catch (error) {
      console.error('Error loading content:', error);
      Alert.alert('Error', 'Failed to load folder content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadContent();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadContent();
    }, [folderId])
  );

  // Apply filtering when content or filter changes
  useEffect(() => {
    if (!Array.isArray(content)) {
      setFiltered([]);
      return;
    }
    if (filter === 'all') {
      setFiltered(content);
      return;
    }
    const typeMap: Record<FilterType, string[]> = {
      all: [],
      ai: ['gemini'],
      tiktok: ['tiktok'],
      reddit: ['reddit'],
      pinterest: ['pinterest'],
    };
    const allowed = new Set(typeMap[filter]);
    setFiltered(content.filter((c) => allowed.has(c.content_type)));
  }, [content, filter]);

  const handleDeleteContent = async (contentId: string) => {
    Alert.alert(
      'Delete Content',
      'Are you sure you want to delete this saved content?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSavedContent(contentId);
              setContent(prev => prev.filter(item => item.id !== contentId));
              Alert.alert('Deleted', 'Content deleted successfully.');
            } catch (error) {
              console.error('Error deleting content:', error);
              Alert.alert('Error', 'Failed to delete content. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderContentItem = ({ item, index }: { item: SavedContentWithFolder; index: number }) => (
    <Animated.View
      style={[
        styles.contentCard,
        {
          opacity: fadeAnim,
          transform: [
            { 
              translateY: slideAnim.interpolate({
                inputRange: [0, 50],
                outputRange: [0, 50 + (index * 20)],
              })
            }
          ],
        },
      ]}
    >
      <FolderContentItem 
        content={item} 
        onDelete={() => handleDeleteContent(item.id)}
        onPress={() => {
          if (item.content_type === 'gemini') {
            setExpandedAiId(prev => (prev === item.id ? null : item.id));
            return;
          }
          setSelectedItem(item);
          setShowModal(true);
        }}
      />
    </Animated.View>
  );

  const renderEmptyState = () => (
    <Animated.View
      style={[
        styles.emptyContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.emptyIcon, { backgroundColor: folderColor as string || theme.colors.primary }]}>
        <Folder size={48} color="white" strokeWidth={2} />
      </View>
      <Text style={styles.emptyTitle}>No content yet</Text>
      <Text style={styles.emptyDescription}>
        This folder is empty. Save some content to see it here.
      </Text>
    </Animated.View>
  );

  const styles = createStyles(theme);

  if (isLoading) {
    return (
      <LinearGradient
        colors={isDark
          ? ['#0F0F0F', '#1A1A1A', '#0F0F0F']
          : ['#F7F7F5', '#FFFFFF', '#F7F7F5']}
        style={styles.container}>
        <SafeAreaView style={[styles.safeArea, { backgroundColor: 'transparent' }]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading content...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={isDark
        ? ['#0F0F0F', '#1A1A1A', '#0F0F0F']
        : ['#F7F7F5', '#FFFFFF', '#F7F7F5']}
      style={styles.container}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: 'transparent' }]}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <Animated.View 
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <ArrowLeft size={24} color={theme.colors.text} strokeWidth={2} />
            </TouchableOpacity>
            
            <View style={styles.headerInfo}>
              <View style={[styles.folderIcon, { backgroundColor: folderColor as string || theme.colors.primary }]}>
                <Folder size={24} color="white" strokeWidth={2} />
              </View>
              <View style={styles.folderDetails}>
                <Text style={styles.folderName}>{folderName || 'Folder'}</Text>
                <Text style={styles.contentCount}>
                  {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Filter Bar */}
          <FilterBar
            visible={true}
            currentFilter={filter}
            onFilterChange={setFilter}
            topOffset={110}
          />

          {/* Spacer: topOffset (110) + filterBar height (60) + desired spacing (20) = 190 */}
          <View style={{ height: 60 }} />

          {/* Content */}
          {filtered.length === 0 ? (
            renderEmptyState()
          ) : (
            <View style={styles.contentContainer}>
              {filtered.map((item, index) => (
                <Animated.View
                  key={item.id}
                  style={[
                    styles.contentCard,
                    {
                      opacity: fadeAnim,
                      transform: [
                        { 
                          translateY: slideAnim.interpolate({
                            inputRange: [0, 50],
                            outputRange: [0, 50 + (index * 20)],
                          })
                        }
                      ],
                    },
                  ]}
                >
                  {item.content_type === 'gemini' ? (
                    <GeminiSection
                      data={{
                        response: item.content_data?.response || item.description || '',
                        success: true,
                        error: '',
                        sources: item.content_data?.sources || [],
                        usage: item.content_data?.usage,
                        hasWebSearch: item.content_data?.hasWebSearch,
                      }}
                      query={item.title || ''}
                      onRetry={() => {}}
                      isLoading={false}
                      cached={true}
                      enableFollowUpChat={false}
                      showSaveButton={false}
                      showSonarBadge={false}
                      onDelete={() => handleDeleteContent(item.id)}
                    />
                  ) : (
                    <FolderContentItem 
                      content={item} 
                      onDelete={() => handleDeleteContent(item.id)}
                      onPress={() => {
                        setSelectedItem(item);
                        setShowModal(true);
                      }}
                    />
                  )}
                </Animated.View>
              ))}
            </View>
          )}
        </ScrollView>
        {/* Modal/Player for selected non-AI items */}
        {showModal && selectedItem && (
          <>
            {selectedItem.content_type === 'tiktok' ? (
              <TikTokModal
                videos={[{
                  id: selectedItem.content_data?.id || selectedItem.id,
                  title: selectedItem.title,
                  thumbnail: selectedItem.thumbnail_url || selectedItem.content_data?.thumbnail,
                  author: selectedItem.content_data?.author || '',
                  views: selectedItem.content_data?.views || '',
                  url: selectedItem.content_data?.url || selectedItem.source_url || ''
                }]}
                isVisible={true}
                onClose={() => { setShowModal(false); setSelectedItem(null); }}
              />
            ) : selectedItem.content_type === 'reddit' ? (
              <RedditModal
                post={{
                  id: selectedItem.content_data?.id || selectedItem.id,
                  title: selectedItem.title,
                  subreddit: selectedItem.content_data?.subreddit || 'reddit',
                  upvotes: selectedItem.content_data?.upvotes || 0,
                  comments: (selectedItem.content_data?.comments || 0),
                  preview: selectedItem.description || '',
                  text: selectedItem.description || '',
                  url: selectedItem.content_data?.url || selectedItem.source_url || '',
                  created: selectedItem.created_at,
                  media: selectedItem.thumbnail_url || selectedItem.content_data?.media || null,
                  thumbnail: selectedItem.thumbnail_url || selectedItem.content_data?.thumbnail || null,
                }}
                isVisible={true}
                onClose={() => { setShowModal(false); setSelectedItem(null); }}
              />
            ) : selectedItem.content_type === 'pinterest' ? (
              <PinterestModal
                pin={{
                  id: selectedItem.content_data?.id || selectedItem.id,
                  title: selectedItem.title || 'Pinterest Pin',
                  description: selectedItem.description || '',
                  image_url: selectedItem.thumbnail_url || selectedItem.content_data?.image_url || '',
                  link: selectedItem.content_data?.link || selectedItem.source_url || '',
                  created_at: selectedItem.created_at,
                  user_name: selectedItem.content_data?.user_name,
                }}
                isVisible={true}
                onClose={() => { setShowModal(false); setSelectedItem(null); }}
              />
            ) : (
              // Gemini/Perplexity: render the GeminiSection exactly with show more button behavior
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: 16 }}>
                <ScrollView contentContainerStyle={{ paddingVertical: 24 }}>
                  <GeminiSection
                    data={{
                      response: selectedItem.content_data?.response || selectedItem.description || '',
                      success: true,
                      error: '',
                      sources: selectedItem.content_data?.sources || [],
                      usage: selectedItem.content_data?.usage,
                      hasWebSearch: selectedItem.content_data?.hasWebSearch,
                    }}
                    query={selectedItem.title || ''}
                    onRetry={() => {}}
                    isLoading={false}
                    cached={true}
                    enableFollowUpChat={false}
                  />
                </ScrollView>
              </View>
            )}
            {/* Close overlay for AI view only */}
            {selectedItem.content_type !== 'tiktok' && selectedItem.content_type !== 'reddit' && selectedItem.content_type !== 'pinterest' && (
              <TouchableOpacity
                style={{ position: 'absolute', top: 40, right: 20, padding: 10, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20 }}
                onPress={() => { setShowModal(false); setSelectedItem(null); }}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#FFFFFF' }}>Close</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Inline AI/Perplexity section removed; handled inline per-item above */}
      </SafeAreaView>
    </LinearGradient>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  folderIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  folderDetails: {
    flex: 1,
  },
  folderName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  contentCount: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
  },
  contentContainer: {
    marginBottom: 40,
  },
  contentCard: {
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
