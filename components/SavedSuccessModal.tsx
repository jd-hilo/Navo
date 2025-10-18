import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { CheckCircle, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

interface SavedSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  folderName: string;
}

export default function SavedSuccessModal({ visible, onClose, title, folderName }: SavedSuccessModalProps) {
  const { theme, isDark } = useTheme();

  const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      width: Math.min(screenWidth * 0.9, 400),
      backgroundColor: theme.colors.surface,
      borderRadius: 24,
      overflow: 'hidden',
    },
    header: {
      padding: 20,
      alignItems: 'center',
      position: 'relative',
    },
    closeButton: {
      position: 'absolute',
      top: 16,
      right: 16,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontFamily: 'Inter-Bold',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
      paddingHorizontal: 20,
    },
    contentTitle: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: theme.colors.text,
      textAlign: 'center',
      paddingHorizontal: 24,
      marginBottom: 8,
    },
    folderName: {
      fontSize: 16,
      fontFamily: 'Inter-Bold',
      color: '#10B981',
      textAlign: 'center',
      paddingHorizontal: 24,
      marginBottom: 24,
    },
    doneButton: {
      margin: 24,
      borderRadius: 16,
      overflow: 'hidden',
    },
    doneGradient: {
      paddingVertical: 16,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    doneText: {
      fontSize: 18,
      fontFamily: 'Inter-Bold',
      color: isDark ? '#000000' : '#FFFFFF',
      marginLeft: 8,
    },
    starImage: {
      position: 'absolute',
      width: 120,
      height: 120,
      opacity: 0.1,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Image
              source={require('@/assets/images/organge star.png')}
              style={[styles.starImage, { top: -30, right: -30, transform: [{ rotate: '45deg' }] }]}
            />
            <Image
              source={require('@/assets/images/organge star.png')}
              style={[styles.starImage, { bottom: -30, left: -30, transform: [{ rotate: '-45deg' }] }]}
            />
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={20} color={theme.colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
            <View style={styles.iconContainer}>
              <CheckCircle size={32} color="#10B981" strokeWidth={2} />
            </View>
            <Text style={styles.title}>Saved Successfully!</Text>
            <Text style={styles.subtitle}>
              Your content has been saved
            </Text>
          </View>

          <View style={{ paddingHorizontal: 24, paddingBottom: 8 }}>
            <Text style={styles.contentTitle}>"{title}"</Text>
            <Text style={styles.folderName}>📁 {folderName}</Text>
          </View>

          <TouchableOpacity style={styles.doneButton} onPress={onClose}>
            <LinearGradient
              colors={isDark ? ['#10B981', '#059669'] : ['#059669', '#047857']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.doneGradient}
            >
              <CheckCircle size={24} color={isDark ? '#000000' : '#FFFFFF'} strokeWidth={2} />
              <Text style={styles.doneText}>Done</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

