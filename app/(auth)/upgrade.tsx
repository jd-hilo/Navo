import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Star, Zap, Database, Settings, ArrowRight } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useRouter } from 'expo-router';

export default function UpgradeScreen() {
  const { theme } = useTheme();
  const { upgradeToPremium, offerings, isLoading } = useSubscription();
  const router = useRouter();

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
      title: 'Up to 300 Searches a Month',
      description: 'Unlimited access to all search sources'
    },
    {
      icon: <Star size={20} color={theme.colors.primary} strokeWidth={2} />,
      title: '1000 Saved Searches',
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
      colors={theme.gradients.gemini as unknown as readonly [string, string, ...string[]]}
      style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Upgrade to Premium</Text>
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
              {isLoading ? (
                <ActivityIndicator size="small" color={theme.colors.surface} />
              ) : (
                <>
                  <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
                  <ArrowRight size={20} color={theme.colors.surface} strokeWidth={2} />
                </>
              )}
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
            Cancel anytime. Terms and conditions apply.
          </Text>
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
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
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
    lineHeight: 24,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  upgradeButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.surface,
    marginRight: 8,
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
    lineHeight: 16,
  },
  upgradeButtonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
}); 