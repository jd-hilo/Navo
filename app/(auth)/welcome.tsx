import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Image,
  Platform,
  Animated,
  Easing,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

export default function WelcomeScreen() {
  const { theme, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Continuous bounce animation
    Animated.loop(
      Animated.sequence([
        Animated.spring(bounceAnim, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnim, {
          toValue: 0,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateY = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10], // Move up 10 units when bouncing
  });

  const handleGetStarted = () => {
    router.push('/(auth)/auth');
  };

  const handleTermsPress = () => {
    Linking.openURL('https://pastoral-supply-662.notion.site/Terms-of-Service-for-Navo-21c2cec59ddf8021a5d5da8c483c267a?source=copy_link');
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
          <Animated.View 
            style={{ 
              opacity: fadeAnim,
              transform: [{ translateY }]
            }}>
          <Image
            source={isDark ? require('@/assets/images/logo in dark.png') : require('@/assets/images/logo in light.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          </Animated.View>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
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
            By clicking Get Started, you agree to our{' '}
            <TouchableOpacity onPress={handleTermsPress} activeOpacity={0.7}>
              <Text style={styles.termsLink}>
                Terms of Service
              </Text>
            </TouchableOpacity>
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
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
  },
  logoSection: {
    flex: 0.35,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 40,
    paddingTop: 60,
  },
  logo: {
    width: 180,
    height: 72,
    maxWidth: '70%',
  },
  contentSection: {
    flex: 0.45,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  ctaSection: {
    flex: 0.2,
    justifyContent: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? 32 : 48,
  },
  getStartedButton: {
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    width: '85%',
    alignSelf: 'center',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  buttonText: {
    fontSize: 17,
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  termsLink: {
    color: theme.colors.primary,
    textDecorationLine: 'underline',
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
});