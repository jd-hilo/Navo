import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Animated,
  Easing,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Folder, Plus, Trash2, Check } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  getSavedContent, 
  deleteSavedContent, 
  moveContentToFolder,
  getUserFolders,
  createFolder,
  deleteFolder,
  getFolderContentCount,
  SavedContentWithFolder,
  Folder as FolderType 
} from '../../services/api';
import { SavedContentCard } from '../../components/SavedContentCard';

export default function SavedContentScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FF6B35'); // Default to orange
  const [isCreating, setIsCreating] = useState(false);
  
  // Animation values
  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const colors = [
    { name: 'Orange', value: '#FF6B35' },
    { name: 'Light Blue', value: '#4FC3F7' },
    { name: 'Red', value: '#F44336' },
  ];

  // Setup animations
  useEffect(() => {
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

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

    floatAnimation.start();
    fadeInAnimation.start();

    return () => {
      floatAnimation.stop();
      floatAnim.setValue(0);
    };
  }, []);

  const loadFolders = async () => {
    try {
      setIsLoading(true);
      const userFolders = await getUserFolders();
      setFolders(userFolders);
    } catch (error) {
      console.error('Error loading folders:', error);
      Alert.alert('Error', 'Failed to load folders. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFolders();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadFolders();
    }, [])
  );

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      Alert.alert('Error', 'Please enter a folder name.');
      return;
    }

    try {
      setIsCreating(true);
      const newFolder = await createFolder(
        newFolderName.trim(),
        undefined,
        selectedColor,
        'folder'
      );
      
      setFolders(prev => [newFolder, ...prev]);
      setNewFolderName('');
      setShowCreateModal(false);
      Alert.alert('Success', 'Folder created successfully!');
    } catch (error) {
      console.error('Error creating folder:', error);
      Alert.alert('Error', 'Failed to create folder. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteFolder = async (folder: FolderType) => {
    Alert.alert(
      'Delete Folder',
      `Are you sure you want to delete "${folder.name}"? This will also delete all content in this folder.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFolder(folder.id);
              setFolders(prev => prev.filter(f => f.id !== folder.id));
              Alert.alert('Deleted', 'Folder deleted successfully.');
            } catch (error) {
              console.error('Error deleting folder:', error);
              Alert.alert('Error', 'Failed to delete folder. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderFolderItem = ({ item }: { item: FolderType }) => (
    <Animated.View
      style={[
        styles.folderCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.folderContent, { borderLeftColor: item.color }]}
        onPress={() => {
          router.push({
            pathname: '/folder-content',
            params: {
              folderId: item.id,
              folderName: item.name,
              folderColor: item.color,
            },
          } as any);
        }}
        activeOpacity={0.8}
      >
        <View style={[styles.folderIcon, { backgroundColor: item.color }]}>
          <Folder size={24} color="white" strokeWidth={2} />
        </View>
        
        <View style={styles.folderInfo}>
          <Text style={styles.folderName}>{item.name}</Text>
          <Text style={styles.folderDescription}>
            {item.description || 'No description'}
          </Text>
        </View>
        
        <View style={styles.folderActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteFolder(item)}
            activeOpacity={0.7}
          >
            <Trash2 size={20} color={theme.colors.error} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
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
      <Animated.Image
        source={require('@/assets/images/magnifying glass and stars.png')}
        style={[
          styles.heroImage,
          {
            transform: [{
              translateY: floatAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -10],
              }),
            }],
          },
        ]}
        resizeMode="contain"
      />
      <Text style={styles.emptyTitle}>No folders yet</Text>
      <Text style={styles.emptyDescription}>
        Create your first folder to organize your saved content
      </Text>
      <TouchableOpacity
        style={styles.createFirstButton}
        onPress={() => setShowCreateModal(true)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#00E5FF', '#2F80ED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.createFirstButtonGradient}
        >
          <Plus size={20} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.createFirstButtonText}>Create Folder</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowCreateModal(false)}
    >
      <LinearGradient
        colors={isDark
          ? ['#0F0F0F', '#1A1A1A', '#0F0F0F']
          : ['#F7F7F5', '#FFFFFF', '#F7F7F5']}
        style={styles.modalContainer}>
        <SafeAreaView style={[styles.safeArea, { backgroundColor: 'transparent' }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowCreateModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Folder</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView 
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>Folder Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter folder name"
              placeholderTextColor={theme.colors.textSecondary}
              value={newFolderName}
              onChangeText={setNewFolderName}
              maxLength={50}
              autoFocus
            />

            <Text style={styles.inputLabel}>Choose Color</Text>
            <View style={styles.colorOptions}>
              {colors.map((color) => (
                <TouchableOpacity
                  key={color.value}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color.value },
                    selectedColor === color.value && styles.selectedColor,
                  ]}
                  onPress={() => setSelectedColor(color.value)}
                  activeOpacity={0.8}
                >
                  {selectedColor === color.value && (
                    <Check size={20} color="white" strokeWidth={2} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.colorLabels}>
              {colors.map((color) => (
                <Text key={color.value} style={styles.colorLabel}>
                  {color.name}
                </Text>
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowCreateModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.createButton, (isCreating || !newFolderName.trim()) && { opacity: 0.5 }]}
              onPress={handleCreateFolder}
              disabled={isCreating || !newFolderName.trim()}
              activeOpacity={0.8}
            >
              {isCreating ? (
                <ActivityIndicator size="small" color={theme.colors.surface} />
              ) : (
                <Text style={styles.createButtonText}>Create</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
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
            <Text style={styles.loadingText}>Loading folders...</Text>
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
            <Text style={styles.title}>Saved Searches</Text>
            <Text style={styles.subtitle}>
              Organize your saved content into folders
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowCreateModal(true)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#00E5FF', '#2F80ED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addButtonGradient}
              >
                <Plus size={20} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.addButtonText}>Create Folder</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Content */}
          {folders.length === 0 ? (
            renderEmptyState()
          ) : (
            <View style={styles.foldersContainer}>
              {folders.map((folder, index) => (
                <Animated.View
                  key={folder.id}
                  style={[
                    styles.folderCard,
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
                  <TouchableOpacity
                    style={[styles.folderContent, { borderLeftColor: folder.color }]}
                    onPress={() => {
                      router.push({
                        pathname: '/folder-content',
                        params: {
                          folderId: folder.id,
                          folderName: folder.name,
                          folderColor: folder.color,
                        },
                      } as any);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.folderIcon, { backgroundColor: folder.color }]}>
                      <Folder size={24} color="white" strokeWidth={2} />
                    </View>
                    
                    <View style={styles.folderInfo}>
                      <Text style={styles.folderName}>{folder.name}</Text>
                      <Text style={styles.folderDescription}>
                        {folder.description || 'No description'}
                      </Text>
                    </View>
                    
                    <View style={styles.folderActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDeleteFolder(folder)}
                        activeOpacity={0.7}
                      >
                        <Trash2 size={20} color={theme.colors.error} strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {renderCreateModal()}
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
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  addButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonText: {
    fontSize: 17,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  foldersContainer: {
    marginBottom: 40,
  },
  folderCard: {
    marginBottom: 16,
  },
  folderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  folderIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  folderInfo: {
    flex: 1,
  },
  folderName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  folderDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  folderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: theme.colors.background,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  heroImage: {
    width: '80%',
    height: 140,
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
    marginBottom: 32,
  },
  createFirstButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  createFirstButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createFirstButtonText: {
    fontSize: 17,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 32,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
  },
  colorOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  colorOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: theme.colors.text,
  },
  colorLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  colorLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    width: 60,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
  },
  createButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.surface,
  },
});
