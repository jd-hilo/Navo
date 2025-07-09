import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { Crown, Star, X, Search, Bookmark, Zap, Settings } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export default function PremiumModal({ visible, onClose, onUpgrade }: PremiumModalProps) {
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
    crownContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(94, 234, 212, 0.15)',
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
    featuresContainer: {
      paddingHorizontal: 24,
      paddingBottom: 24,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    featureIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(94, 234, 212, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    featureText: {
      flex: 1,
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: theme.colors.text,
    },
    upgradeButton: {
      margin: 24,
      borderRadius: 16,
      overflow: 'hidden',
    },
    upgradeGradient: {
      paddingVertical: 16,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    upgradeText: {
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
            <View style={styles.crownContainer}>
              <Crown size={32} color="#5EEAD4" strokeWidth={2} />
            </View>
            <Text style={styles.title}>Upgrade to Premium</Text>
            <Text style={styles.subtitle}>
              Unlock unlimited searches and premium features to supercharge your search experience
            </Text>
          </View>

          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Search size={20} color="#5EEAD4" strokeWidth={2} />
              </View>
              <Text style={styles.featureText}>Unlimited searches</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Bookmark size={20} color="#5EEAD4" strokeWidth={2} />
              </View>
              <Text style={styles.featureText}>500 saved searches</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Zap size={20} color="#5EEAD4" strokeWidth={2} />
              </View>
              <Text style={styles.featureText}>Faster loading times</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Settings size={20} color="#5EEAD4" strokeWidth={2} />
              </View>
              <Text style={styles.featureText}>Custom search settings</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
            <LinearGradient
              colors={isDark ? ['#5EEAD4', '#2DD4BF'] : ['#2DD4BF', '#14B8A6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.upgradeGradient}
            >
              <Crown size={24} color={isDark ? '#000000' : '#FFFFFF'} strokeWidth={2} />
              <Text style={styles.upgradeText}>Upgrade Now</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
} 