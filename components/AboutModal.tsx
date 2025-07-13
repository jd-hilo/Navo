import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { BlurView } from 'expo-blur';

interface AboutModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AboutModal({ visible, onClose }: AboutModalProps) {
  const { theme, isDark } = useTheme();

  const upcomingFeatures = [
    {
      title: 'More Search Channels',
      description: 'Integration with additional platforms to provide even more comprehensive search results',
    },
    {
      title: 'Customizable Search Results',
      description: 'Personalize your search experience by choosing which sources to prioritize and how results are displayed',
    },
    {
      title: 'Enhanced Save Feature',
      description: 'Organize saved searches with tags, folders, and smart collections for better management',
    },
  ];

  const whatsNew = [
    {
      title: 'Enhanced Search Experience',
      description: 'Improved search algorithm and faster results delivery',
    },
    {
      title: 'Referral Program',
      description: 'Get 25 extra searches for each friend you invite',
    },
    {
      title: 'UI Improvements',
      description: 'Refined interface with smoother animations and better accessibility',
    },
  ];

  const styles = createStyles(theme);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <BlurView
          style={StyleSheet.absoluteFill}
          intensity={90}
          tint={isDark ? 'dark' : 'light'}
        />
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Image
              source={isDark ? require('@/assets/images/logo in dark.png') : require('@/assets/images/logo in light.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={theme.colors.text} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.version}>Version 1.5</Text>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What's New</Text>
              {whatsNew.map((item, index) => (
                <View key={index} style={styles.featureItem}>
                  <Text style={styles.featureTitle}>{item.title}</Text>
                  <Text style={styles.featureDescription}>{item.description}</Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What's Coming</Text>
              {upcomingFeatures.map((item, index) => (
                <View key={index} style={styles.featureItem}>
                  <Text style={styles.featureTitle}>{item.title}</Text>
                  <Text style={styles.featureDescription}>{item.description}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  logo: {
    width: 120,
    height: 40,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 24,
  },
  version: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontFamily: 'Inter-Regular',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  featureItem: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
}); 