import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { saveContent, getUserFolders, createDefaultFolder, Folder } from '../services/api';
import { FolderSelectionModal } from './FolderSelectionModal';

interface SaveButtonProps {
  contentType: 'tiktok' | 'reddit' | 'pinterest' | 'gemini';
  contentData: any;
  title: string;
  description?: string;
  sourceUrl?: string;
  thumbnailUrl?: string;
  onSaved?: () => void;
  size?: 'small' | 'medium' | 'large';
  variant?: 'icon' | 'button';
}

export const SaveButton: React.FC<SaveButtonProps> = ({
  contentType,
  contentData,
  title,
  description,
  sourceUrl,
  thumbnailUrl,
  onSaved,
  size = 'medium',
  variant = 'icon',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);

  const handleSave = async () => {
    try {
      console.log('Save button pressed');
      setIsLoading(true);

      // Get user's folders
      const folders = await getUserFolders();
      console.log('Folders loaded:', folders.length);
      
      // Always show the modal for folder selection
      console.log('Showing folder modal');
      setShowFolderModal(true);
    } catch (error) {
      console.error('Error loading folders:', error);
      Alert.alert('Error', 'Failed to load folders. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFolderSelect = async (folderId: string, folderName: string) => {
    try {
      setIsLoading(true);
      await saveContent(
        folderId,
        contentType,
        contentData,
        title,
        description,
        sourceUrl,
        thumbnailUrl
      );
      setIsSaved(true);
      onSaved?.();
      Alert.alert('Saved!', `"${title}" has been saved to ${folderName}`);
    } catch (error) {
      console.error('Error saving content:', error);
      Alert.alert('Error', 'Failed to save content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  const getIconSize = () => {
    switch (size) {
      case 'small': return 20;
      case 'medium': return 24;
      case 'large': return 28;
      default: return 24;
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'small': return 44;
      case 'medium': return 52;
      case 'large': return 60;
      default: return 52;
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small': return 'text-xs';
      case 'medium': return 'text-sm';
      case 'large': return 'text-base';
      default: return 'text-sm';
    }
  };

  if (variant === 'icon') {
    return (
      <View style={{ zIndex: 1000 }}>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isLoading}
          className={`rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center ${
            isSaved ? 'bg-green-100 dark:bg-green-900' : ''
          }`}
          style={{ width: getButtonSize(), height: getButtonSize() }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#6B7280" />
          ) : (
            <Ionicons
              name={isSaved ? 'checkmark' : 'bookmark-outline'}
              size={getIconSize()}
              color={isSaved ? '#10B981' : '#6B7280'}
            />
          )}
        </TouchableOpacity>

        <FolderSelectionModal
          visible={showFolderModal}
          onClose={() => {
            console.log('Closing folder modal');
            setShowFolderModal(false);
          }}
          onSelectFolder={handleFolderSelect}
          title="Save Content"
          description={`Choose a folder to save "${title}":`}
        />
      </View>
    );
  }

  return (
    <View style={{ zIndex: 1000 }}>
      <TouchableOpacity
        onPress={handleSave}
        disabled={isLoading}
        className={`flex-row items-center justify-center px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 ${
          isSaved ? 'bg-green-100 dark:bg-green-900' : ''
        }`}
        style={{ minHeight: getButtonSize() }}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#6B7280" className="mr-2" />
        ) : (
          <Ionicons
            name={isSaved ? 'checkmark' : 'bookmark-outline'}
            size={getIconSize()}
            color={isSaved ? '#10B981' : '#6B7280'}
            className="mr-2"
          />
        )}
        <Text className={`text-gray-700 dark:text-gray-300 ${getTextSize()}`}>
          {isSaved ? 'Saved' : 'Save'}
        </Text>
      </TouchableOpacity>

      <FolderSelectionModal
        visible={showFolderModal}
        onClose={() => {
          console.log('Closing folder modal');
          setShowFolderModal(false);
        }}
        onSelectFolder={handleFolderSelect}
        title="Save Content"
        description={`Choose a folder to save "${title}":`}
      />
    </View>
  );
};
