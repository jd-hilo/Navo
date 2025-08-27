import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Star, Zap, Database, Settings, ArrowRight } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useRouter } from 'expo-router';

export default function UpgradeScreen() {
  const { theme, isDark } = useTheme();
  const { upgradeToPremium, offerings, isLoading } = useSubscription();
  const router = useRouter();
  
  // Animation value for floating effect
  const floatAnim = useRef(new Animated.Value(0)).current;

  // Setup floating animation
  useEffect(() => {
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    floatAnimation.start();

    return () => {
      floatAnimation.stop();
      floatAnim.setValue(0);
    };
  }, []);

  const handleUpgrade = async () => {
    try {
      await upgradeToPremium();
      router.replace('/(tabs)');
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert('Error', 'Failed to complete purchase. Please try again.');
      }
    }
  };

  const handleSkip = () => {
    router.push('/(auth)/refer-friend' as any);
  };

  const handlePrivacyPress = () => {
    Linking.openURL('https://pastoral-supply-662.notion.site/Privacy-Policy-Navo-21c2cec59ddf80af8976cfc4e5c9c30f');
  };

  const handleTermsPress = () => {
    Linking.openURL('https://pastoral-supply-662.notion.site/Terms-of-Service-Navo-21c2cec59ddf8021a5d5da8c483c267a?source=copy_link');
  };

  const getPrice = () => {
    if (offerings?.availablePackages.length) {
      const packageInfo = offerings.availablePackages[0];
      return packageInfo.product.priceString;
    }
    return '$4.99';
  };

  const features = [
    {
      icon: <Zap size={20} color={theme.colors.primary} strokeWidth={2} />,
      title: 'Faster Loading Screens',
      description: 'Lightning-fast search results with optimized performance'
    },
    {
      icon: <Database size={20} color={theme.colors.primary} strokeWidth={2} />,
      title: 'Unlimited Searches',
      description: 'No monthly search limits'
    },
    {
      icon: <Star size={20} color={theme.colors.primary} strokeWidth={2} />,
      title: '500 Saved Searches',
      description: 'Never lose important search results again'
    },
    {
      icon: <Settings size={20} color={theme.colors.primary} strokeWidth={2} />,
      title: 'Search Customization',
      description: 'Personalize your search experience'
    }
  ];

  const styles = createStyles(theme);

  return (
    <LinearGradient
      colors={isDark
        ? ['#0F0F0F', '#1A1A1A', '#0F0F0F']
        : ['#F7F7F5', '#FFFFFF', '#F7F7F5']}
      style={styles.container}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: 'transparent' }]}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          
          {/* Hero Image */}
          <View style={styles.heroContainer}>
            <Animated.Image
              source={require('@/assets/images/magnifying glass and stars.png')}
              style={[
                styles.heroImage,
                {
                  transform: [{
                    translateY: floatAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -10],
                    }),
                  }],
                },
              ]}
              resizeMode="contain"
            />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Upgrade to Navo Premium</Text>
            <Text style={styles.subtitle}>
              Unlock the full potential of your search experience
            </Text>
          </View>

          {/* Features List */}
          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  {feature.icon}
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
                <Check size={16} color={theme.colors.success} strokeWidth={2} />
              </View>
            ))}
          </View>

          {/* Pricing */}
          <View style={styles.pricingContainer}>
            <Text style={styles.pricingTitle}>Premium Plan</Text>
            <Text style={styles.pricingAmount}>{getPrice()}</Text>
            <Text style={styles.pricingPeriod}>per month</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.upgradeButton, isLoading && styles.upgradeButtonDisabled]}
              onPress={handleUpgrade}
              disabled={isLoading}
              activeOpacity={0.8}>
              <LinearGradient
                colors={['#00E5FF', '#2F80ED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.upgradeButtonGradient}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
                    <ArrowRight size={20} color="#FFFFFF" strokeWidth={2} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              disabled={isLoading}
              activeOpacity={0.8}>
              <Text style={styles.skipButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>

          {/* Terms */}
          <Text style={styles.termsText}>
            By clicking Upgrade Now, you agree to our{' '}
            <Text style={styles.link} onPress={handleTermsPress}>
              Terms of Service
            </Text>{' '}
            and{' '}
            <Text style={styles.link} onPress={handlePrivacyPress}>
              Privacy Policy
            </Text>
          </Text>

          {/* Subscription Message */}
          <View style={styles.disclosureContainer}>
            <Text style={styles.disclosureNote}>
              Your subscription will automatically renew unless auto-renew is turned off at least 24 hours before the end of the current period. You can manage your subscription and turn off auto-renewal in your App Store account settings.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  heroContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  heroImage: {
    width: '80%',
    height: 140,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresContainer: {
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
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
  pricingContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 24,
    borderRadius: 16,
    marginBottom: 32,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  pricingTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  pricingAmount: {
    fontSize: 36,
    fontFamily: 'Inter-Bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  pricingPeriod: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  upgradeButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  upgradeButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 17,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    marginRight: 4,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
  },
  termsText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  disclosureContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  disclosureNote: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  link: {
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
  upgradeButtonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
}); 