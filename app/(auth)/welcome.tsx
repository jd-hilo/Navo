import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

export default function WelcomeScreen() {
  const { theme, isDark } = useTheme();

  const handleGetStarted = () => {
    router.push('/(auth)/email');
  };

  const styles = createStyles(theme);

  return (
    <LinearGradient
      colors={isDark ? ['#0F0F0F', '#1A1A1A', '#0F0F0F'] : ['#F7F7F5', '#FFFFFF', '#F7F7F5']}
      style={styles.container}>
      
      {/* Background Pattern */}
      <View style={styles.backgroundPattern}>
        {Array.from({ length: 15 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.patternLine,
              {
                transform: [
                  { rotate: `${-10 + (i * 3)}deg` },
                  { translateX: i * 60 - 150 },
                  { translateY: i * 40 - 80 },
                ],
                opacity: isDark ? 0.02 : 0.015,
              },
            ]}
          />
        ))}
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Image
            source={isDark ? require('@/assets/images/logo in dark.png') : require('@/assets/images/logo in light.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          
          <View style={styles.sparkleContainer}>
            <Sparkles size={24} color={theme.colors.text} strokeWidth={2} />
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          <Text style={styles.title}>Welcome to Navo</Text>
          <Text style={styles.subtitle}>
            Search across Gemini, TikTok, and Reddit all in one place. 
            Get comprehensive results from multiple sources instantly.
          </Text>

          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>AI-powered search with Google Gemini</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>Trending TikTok content discovery</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>Real-time Reddit discussions</Text>
            </View>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={handleGetStarted}
            activeOpacity={0.8}>
            <LinearGradient
              colors={isDark ? ['#FFFFFF', '#F0F0F0'] : ['#000000', '#333333']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}>
              <Text style={styles.buttonText}>Get Started</Text>
              <ArrowRight 
                size={20} 
                color={isDark ? '#000000' : '#FFFFFF'} 
                strokeWidth={2} 
              />
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  patternLine: {
    position: 'absolute',
    width: 2,
    height: 150,
    backgroundColor: theme.colors.text,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
  },
  logoSection: {
    flex: 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  logo: {
    width: 180,
    height: 72,
    maxWidth: '70%',
  },
  sparkleContainer: {
    position: 'absolute',
    top: '20%',
    right: '25%',
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 8,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  contentSection: {
    flex: 0.4,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  featuresContainer: {
    paddingHorizontal: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.text,
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
    flex: 1,
  },
  ctaSection: {
    flex: 0.2,
    justifyContent: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? 20 : 40,
  },
  getStartedButton: {
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.background,
    marginRight: 8,
  },
  termsText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 16,
  },
});