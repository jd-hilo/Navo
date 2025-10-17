import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { getUserFolders, createFolder, Folder } from '../services/api';

interface FolderSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectFolder: (folderId: string, folderName: string) => void;
  title?: string;
  description?: string;
}

export const FolderSelectionModal: React.FC<FolderSelectionModalProps> = ({
  visible,
  onClose,
  onSelectFolder,
  title = 'Choose Folder',
  description = 'Select a folder to save this content:',
}) => {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [selectedIcon, setSelectedIcon] = useState('folder');

  const colors = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#84CC16', // Lime
  ];

  const icons = [
    'folder',
    'bookmark',
    'heart',
    'star',
    'book',
    'camera',
    'musical-notes',
    'game-controller',
    'car',
    'home',
    'briefcase',
    'school',
  ];

  useEffect(() => {
    if (visible) {
      loadFolders();
    }
  }, [visible]);

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

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      Alert.alert('Error', 'Please enter a folder name.');
      return;
    }

    try {
      setIsCreatingFolder(true);
      const newFolder = await createFolder(
        newFolderName.trim(),
        newFolderDescription.trim() || undefined,
        selectedColor,
        selectedIcon
      );
      
      setFolders(prev => [newFolder, ...prev]);
      setNewFolderName('');
      setNewFolderDescription('');
      setShowCreateForm(false);
      Alert.alert('Success', 'Folder created successfully!');
    } catch (error) {
      console.error('Error creating folder:', error);
      Alert.alert('Error', 'Failed to create folder. Please try again.');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleSelectFolder = (folder: Folder) => {
    onSelectFolder(folder.id, folder.name);
    onClose();
  };

  const handleOpenCreateFolder = () => {
    // Close this modal first
    onClose();
    // Navigate to saved folders screen and trigger create modal
    router.push({
      pathname: '/(tabs)/saved',
      params: { openCreate: 'true' }
    } as any);
  };

  const styles = createStyles(theme, isDark);

  const renderFolderItem = ({ item }: { item: Folder }) => (
    <TouchableOpacity
      style={styles.folderItem}
      onPress={() => handleSelectFolder(item)}
    >
      <View style={[styles.folderIcon, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon as any} size={24} color="white" />
      </View>
      <View style={styles.folderInfo}>
        <Text style={styles.folderName}>{item.name}</Text>
        {item.description && (
          <Text style={styles.folderDescription}>{item.description}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderCreateForm = () => (
    <View style={styles.createForm}>
      <Text style={styles.createFormTitle}>Create New Folder</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Folder name"
        placeholderTextColor={theme.colors.textSecondary}
        value={newFolderName}
        onChangeText={setNewFolderName}
        maxLength={50}
      />
      
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Description (optional)"
        placeholderTextColor={theme.colors.textSecondary}
        value={newFolderDescription}
        onChangeText={setNewFolderDescription}
        multiline
        maxLength={200}
      />

      <Text style={styles.sectionTitle}>Choose Color</Text>
      <View style={styles.colorGrid}>
        {colors.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              selectedColor === color && styles.selectedColor,
            ]}
            onPress={() => setSelectedColor(color)}
          />
        ))}
      </View>

      <Text style={styles.sectionTitle}>Choose Icon</Text>
      <View style={styles.iconGrid}>
        {icons.map((icon) => (
          <TouchableOpacity
            key={icon}
            style={[
              styles.iconOption,
              selectedIcon === icon && styles.selectedIcon,
            ]}
            onPress={() => setSelectedIcon(icon)}
          >
            <Ionicons
              name={icon as any}
              size={20}
              color={selectedIcon === icon ? theme.colors.primary : theme.colors.textSecondary}
            />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.createFormButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setShowCreateForm(false)}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateFolder}
          disabled={isCreatingFolder}
        >
          {isCreatingFolder ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.createButtonText}>Create</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity
            onPress={handleOpenCreateFolder}
            style={styles.addButton}
          >
            <Ionicons name="add" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.description}>{description}</Text>

        {showCreateForm ? (
          renderCreateForm()
        ) : (
          <View style={styles.folderList}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading folders...</Text>
              </View>
            ) : folders.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="folder-outline" size={64} color={theme.colors.textSecondary} />
                <Text style={styles.emptyTitle}>No folders yet</Text>
                <Text style={styles.emptyDescription}>
                  Create your first folder to organize your saved content
                </Text>
                <TouchableOpacity
                  style={styles.createFirstButton}
                  onPress={handleOpenCreateFolder}
                >
                  <Text style={styles.createFirstButtonText}>Create Folder</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={folders}
                keyExtractor={(item) => item.id}
                renderItem={renderFolderItem}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        )}
      </View>
    </Modal>
  );
};

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    zIndex: 9999,
    elevation: 9999,
  },
  header: {
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  addButton: {
    padding: 8,
  },
  description: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  folderList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    marginBottom: 8,
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
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  folderDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  createFirstButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: isDark ? theme.colors.text : 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  createForm: {
    flex: 1,
    paddingHorizontal: 20,
  },
  createFormTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: theme.colors.text,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginBottom: 12,
    backgroundColor: theme.colors.surface,
  },
  selectedIcon: {
    backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#EBF4FF',
  },
  createFormButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingBottom: 40,
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
    color: isDark ? theme.colors.text : 'white',
    fontWeight: '600',
  },
});
