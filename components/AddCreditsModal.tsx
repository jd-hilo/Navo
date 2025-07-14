import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';
import { Crown, Share, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface AddCreditsModalProps {
  visible: boolean;
  onClose: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export default function AddCreditsModal({ visible, onClose }: AddCreditsModalProps) {
  const { theme, isDark } = useTheme();
  const router = useRouter();

  const handleUpgrade = () => {
    onClose();
    router.push('/(auth)/upgrade');
  };

  const handleInvite = () => {
    onClose();
    router.push('/(auth)/refer-friend');
  };

  const styles = createStyles(theme);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView
        style={styles.overlay}
        intensity={90}
        tint={isDark ? 'dark' : 'light'}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={theme.colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>

          <Text style={styles.title}>Get More Searches</Text>
          <Text style={styles.subtitle}>Choose how you want to earn more search credits</Text>

          <TouchableOpacity style={styles.optionButton} onPress={handleUpgrade}>
            <View style={styles.optionIcon}>
              <Crown size={24} color={theme.colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Upgrade to Premium</Text>
              <Text style={styles.optionDescription}>
                Get unlimited searches and premium features
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionButton} onPress={handleInvite}>
            <View style={styles.optionIcon}>
              <Share size={24} color={theme.colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Invite Friends</Text>
              <Text style={styles.optionDescription}>
                Earn credits for each friend that joins
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </BlurView>
    </Modal>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modalContainer: {
    width: Math.min(screenWidth - 48, 400),
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${theme.colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
  },
}); 