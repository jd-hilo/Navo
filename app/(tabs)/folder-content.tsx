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

export default function FolderContentScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const { folderId, folderName, folderColor } = useLocalSearchParams();
  
  const [content, setContent] = useState<SavedContentWithFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
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
      <SavedContentCard 
        content={item} 
        onDelete={() => handleDeleteContent(item.id)}
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
                  {content.length} {content.length === 1 ? 'item' : 'items'}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Content */}
          {content.length === 0 ? (
            renderEmptyState()
          ) : (
            <View style={styles.contentContainer}>
              {content.map((item, index) => (
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
                  <SavedContentCard 
                    content={item} 
                    onDelete={() => handleDeleteContent(item.id)}
                  />
                </Animated.View>
              ))}
            </View>
          )}
        </ScrollView>
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
