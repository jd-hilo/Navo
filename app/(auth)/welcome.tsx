import React, { useEffect, useRef, useState } from 'react';
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
  FlatList,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Adjust, AdjustEvent } from 'react-native-adjust';

const { width: screenWidth } = Dimensions.get('window');

const onboardingImages = [
  require('@/assets/images/OB 7.png'),
  require('@/assets/images/OB 8.png'),
  require('@/assets/images/OB 9.png'),
];

// Dark theme colors for welcome screen
const darkColors = {
  background: '#0F0F0F',
  surface: '#1A1A1A',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  border: '#2A2A2A',
  primary: '#FFFFFF',
  shadow: '#000000',
};

export default function WelcomeScreen() {
  const { theme } = useTheme(); // Keep theme for non-color properties
  const [activeIndex, setActiveIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleGetStarted = () => {
    // Track get started event with Adjust
    const event = new AdjustEvent('27gu4x');
    event.addCallbackParameter('action', 'get_started');
    Adjust.trackEvent(event);
    
    router.push('/(auth)/auth');
  };

  const handleTermsPress = () => {
    Linking.openURL('https://pastoral-supply-662.notion.site/Terms-of-Service-for-Navo-21c2cec59ddf8021a5d5da8c483c267a?source=copy_link');
  };

  const handlePrivacyPress = () => {
    Linking.openURL('https://pastoral-supply-662.notion.site/Privacy-Policy-Navo-21c2cec59ddf80af8976cfc4e5c9c30f?source=copy_link');
  };

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const index = Math.round(contentOffset.x / screenWidth);
    setActiveIndex(index);
  };

  const renderOnboardingItem = ({ item }: { item: any }) => (
    <View style={styles.onboardingSlide}>
      <Image
        source={item}
        style={styles.onboardingImage}
        resizeMode="contain"
      />
    </View>
  );

  const renderPaginationDots = () => (
    <View style={styles.paginationContainer}>
      {onboardingImages.map((_, index) => (
        <View
          key={index}
          style={[
            styles.paginationDot,
            { backgroundColor: index === activeIndex ? darkColors.text : darkColors.textSecondary }
          ]}
        />
      ))}
    </View>
  );

  const styles = createStyles();

  return (
    <LinearGradient
      colors={['#0F0F0F', '#0F0F0F', '#0F0F0F']}
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
                opacity: 0.02,
              },
            ]}
          />
        ))}
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* BWB Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/bwb.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Onboarding Carousel Section */}
        <View style={styles.carouselSection}>
          <FlatList
            ref={flatListRef}
            data={onboardingImages}
            renderItem={renderOnboardingItem}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={styles.carousel}
          />
          {renderPaginationDots()}
        </View>

        {/* Content and CTA Sections with padding */}
        <View style={styles.contentWrapper}>
          <View style={styles.contentSection}>
          </View>

          <View style={styles.ctaSection}>
            <TouchableOpacity
              style={styles.getStartedButton}
              onPress={handleGetStarted}
              activeOpacity={0.8}>
              <LinearGradient
                colors={['#FFFFFF', '#F0F0F0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}>
                <Text style={styles.buttonText}>Get Started</Text>
                <ArrowRight 
                  size={20} 
                  color="#000000"
                  strokeWidth={2} 
                />
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.termsText}>
              By clicking Get Started, you agree to our{' '}
              <Text style={styles.termsLink} onPress={handleTermsPress}>
                  Terms of Service
                </Text>
              {' '}and{' '}
              <Text style={styles.termsLink} onPress={handlePrivacyPress}>
                Privacy Policy
              </Text>
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const createStyles = () => StyleSheet.create({
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
    backgroundColor: darkColors.text,
  },
  safeArea: {
    flex: 1,
  },
  carouselSection: {
    height: screenWidth * 1.3,
    backgroundColor: darkColors.background,
  },
  carousel: {
    flex: 1,
  },
  onboardingSlide: {
    width: screenWidth,
    height: screenWidth * 1.3,
  },
  onboardingImage: {
    width: screenWidth,
    height: screenWidth * 1.3,
    resizeMode: 'cover',
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 24,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  contentSection: {
    flex: 0.2,
    justifyContent: 'center',
  },
  ctaSection: {
    flex: 0.8,
    justifyContent: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? 32 : 48,
  },
  getStartedButton: {
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: darkColors.shadow,
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
    color: darkColors.background,
    marginRight: 8,
  },
  termsText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: darkColors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    width: '85%',
    alignSelf: 'center',
  },
  termsLink: {
    color: darkColors.primary,
    textDecorationLine: 'underline',
    fontFamily: 'Inter-Regular',
  },
  logoContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    zIndex: 1,
  },
  logo: {
    width: 40,
    height: 40,
  },
});