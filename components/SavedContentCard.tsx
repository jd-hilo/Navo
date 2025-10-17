import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SavedContentWithFolder } from '../services/api';

interface SavedContentCardProps {
  content: SavedContentWithFolder;
  onPress?: () => void;
  onMove?: () => void;
  onDelete?: () => void;
  showFolderInfo?: boolean;
}

export const SavedContentCard: React.FC<SavedContentCardProps> = ({
  content,
  onPress,
  onMove,
  onDelete,
  showFolderInfo = true,
}) => {
  const getContentIcon = () => {
    switch (content.content_type) {
      case 'tiktok':
        return 'musical-notes';
      case 'reddit':
        return 'logo-reddit';
      case 'pinterest':
        return 'logo-pinterest';
      case 'gemini':
        return 'sparkles';
      default:
        return 'document';
    }
  };

  const getContentColor = () => {
    switch (content.content_type) {
      case 'tiktok':
        return '#000000';
      case 'reddit':
        return '#FF4500';
      case 'pinterest':
        return '#E60023';
      case 'gemini':
        return '#4285F4';
      default:
        return '#6B7280';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const renderContentPreview = () => {
    if (content.thumbnail_url) {
      return (
        <Image
          source={{ uri: content.thumbnail_url }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      );
    }

    return (
      <View style={[styles.placeholder, { backgroundColor: getContentColor() + '20' }]}>
        <Ionicons
          name={getContentIcon()}
          size={32}
          color={getContentColor()}
        />
      </View>
    );
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        {renderContentPreview()}
        
        <View style={styles.textContent}>
          <View style={styles.header}>
            <View style={styles.typeIndicator}>
              <Ionicons
                name={getContentIcon()}
                size={16}
                color={getContentColor()}
              />
              <Text style={[styles.typeText, { color: getContentColor() }]}>
                {content.content_type.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.dateText}>
              {formatDate(content.created_at)}
            </Text>
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {content.title}
          </Text>

          {content.description && (
            <Text style={styles.description} numberOfLines={2}>
              {content.description}
            </Text>
          )}

          {showFolderInfo && (
            <View style={styles.folderInfo}>
              <View style={[styles.folderIcon, { backgroundColor: content.folder_color }]}>
                <Ionicons name={content.folder_icon as any} size={14} color="white" />
              </View>
              <Text style={styles.folderName}>{content.folder_name}</Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          {onMove && (
            <TouchableOpacity style={styles.actionButton} onPress={onMove}>
              <Ionicons name="folder-outline" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    padding: 16,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  folderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  folderIcon: {
    width: 20,
    height: 20,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  folderName: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingLeft: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
  },
});
