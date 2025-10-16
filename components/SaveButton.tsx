import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
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
  const { isDark } = useTheme();

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
    const iconColor = isSaved ? '#10B981' : (isDark ? '#FFFFFF' : '#000000');
    
    return (
      <View style={{ zIndex: 1000 }}>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isLoading}
          style={styles.iconButtonClean}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={iconColor} />
          ) : (
            <Ionicons
              name={isSaved ? 'checkmark-circle' : 'bookmark'}
              size={getIconSize()}
              color={iconColor}
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
        style={[
          styles.buttonVariant,
          { minHeight: getButtonSize() },
          isSaved && styles.buttonVariantSaved
        ]}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#3B82F6" style={{ marginRight: 8 }} />
        ) : (
          <Ionicons
            name={isSaved ? 'checkmark-circle' : 'bookmark'}
            size={getIconSize()}
            color={isSaved ? '#10B981' : '#3B82F6'}
            style={{ marginRight: 8 }}
          />
        )}
        <Text style={[
          styles.buttonText,
          isSaved && styles.buttonTextSaved
        ]}>
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

const styles = StyleSheet.create({
  iconButtonClean: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  buttonVariant: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonVariantSaved: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
    shadowColor: '#10B981',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  buttonTextSaved: {
    color: '#10B981',
  },
});
