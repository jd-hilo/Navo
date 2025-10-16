import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { 
  getSavedContent, 
  deleteSavedContent, 
  moveContentToFolder,
  getUserFolders,
  createFolder,
  deleteFolder,
  getFolderContentCount,
  SavedContentWithFolder,
  Folder 
} from '../services/api';
import { SavedContentCard } from '../components/SavedContentCard';

export default function SavedContentScreen() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FF6B35'); // Default to orange
  const [isCreating, setIsCreating] = useState(false);

  const colors = [
    { name: 'Orange', value: '#FF6B35' },
    { name: 'Light Blue', value: '#4FC3F7' },
    { name: 'Red', value: '#F44336' },
  ];

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

  const handleDeleteFolder = async (folder: Folder) => {
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

  const renderFolderItem = ({ item }: { item: Folder }) => (
    <TouchableOpacity
      style={[styles.folderCard, { borderLeftColor: item.color }]}
      onPress={() => {
        // TODO: Navigate to folder content view
        console.log('Open folder:', item);
      }}
    >
      <View style={styles.folderContent}>
        <View style={[styles.folderIcon, { backgroundColor: item.color }]}>
          <Ionicons name="folder" size={24} color="white" />
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
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="folder-outline" size={80} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>No folders yet</Text>
      <Text style={styles.emptyDescription}>
        Create your first folder to organize your saved content
      </Text>
      <TouchableOpacity
        style={styles.createFirstButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" size={20} color="white" />
        <Text style={styles.createFirstButtonText}>Create Folder</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowCreateModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => setShowCreateModal(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Create Folder</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.modalContent}>
          <Text style={styles.inputLabel}>Folder Name</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter folder name"
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
              >
                {selectedColor === color.value && (
                  <Ionicons name="checkmark" size={20} color="white" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowCreateModal(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateFolder}
            disabled={isCreating || !newFolderName.trim()}
          >
            {isCreating ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.createButtonText}>Create</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading folders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Searches</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {folders.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={folders}
          keyExtractor={(item) => item.id}
          renderItem={renderFolderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {renderCreateModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  addButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  folderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  folderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  folderDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  folderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  createFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createFirstButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 32,
    backgroundColor: '#FFFFFF',
  },
  colorOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
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
    borderColor: '#111827',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#374151',
  },
  createButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
  },
  createButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});
