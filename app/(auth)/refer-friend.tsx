import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Share,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '@/contexts/AuthContext';
import { Adjust, AdjustEvent } from 'react-native-adjust';

const { width: screenWidth } = Dimensions.get('window');

export default function ReferFriendScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const { user, getReferralCode } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    loadReferralCode();
  }, []);

  const loadReferralCode = async () => {
    const code = await getReferralCode();
    setReferralCode(code);
  };

  const handleContinue = async () => {
    router.replace('/(tabs)');
  };

  const referAFriend = async () => {
    if (!referralCode) return;

    const event = new AdjustEvent('fe9jhz');
    event.addCallbackParameter('action', 'shared_referral_code');
    console.log("adjust : event sent")
    Adjust.trackEvent(event);
    
    await Clipboard.setStringAsync(referralCode);
    await Share.share({
      message: `Download Navo and use my referral code ${referralCode} for 25 free searches ✨\n\nhttps://apps.apple.com/us/app/navo-magic-search/id6747410792`,
    });
  };

  const styles = createStyles(theme);

  return (
    <LinearGradient
      colors={isDark
        ? ['#0F0F0F', '#1A1A1A', '#0F0F0F']
        : ['#F7F7F5', '#FFFFFF', '#F7F7F5']}
      style={styles.container}
    >
      <SafeAreaView style={[styles.safeArea, { backgroundColor: 'transparent' }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Decorative Elements */}
          <Image
            source={require('@/assets/images/blue.png')}
            style={[styles.decorativeElement, styles.blueStar]}
            resizeMode="contain"
          />
          <Image
            source={require('@/assets/images/organge star.png')}
            style={[styles.decorativeElement, styles.orangeStar]}
            resizeMode="contain"
          />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Invite Friends{'\n'}Get Credits</Text>
            <Text style={styles.subtitle}>
              Share your referral code and you'll both get 25 free search credits
            </Text>
          </View>

          {/* Referral Code Display */}
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>Your Referral Code</Text>
            <Text style={styles.code}>{referralCode || '...'}</Text>
          </View>

          {/* How it works */}
          <View style={styles.pricingContainer}>
            <Text style={styles.pricingTitle}>How it works</Text>
            <View style={styles.stepsContainer}>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepText}>Share your referral code with friends</Text>
              </View>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepText}>Friend creates account using your code</Text>
              </View>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepText}>You both receive 25 search credits!</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.referButton}
              onPress={referAFriend}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#00E5FF', '#2F80ED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.referButtonGradient}
              >
                <Text style={styles.referButtonText}>Share Referral Code</Text>
                <ArrowRight size={20} color="#FFFFFF" strokeWidth={2} />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.skipButtonText}>Continue to App</Text>
            </TouchableOpacity>
          </View>

          {/* Terms */}
          <Text style={styles.termsText}>
            Each referral code can be used up to 3 times
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
  decorativeElement: {
    position: 'absolute',
    zIndex: 1,
  },
  blueStar: {
    width: screenWidth * 0.15,
    height: screenWidth * 0.15,
    top: 20,
    left: 20,
    opacity: 0.8,
  },
  orangeStar: {
    width: screenWidth * 0.12,
    height: screenWidth * 0.12,
    top: 40,
    right: 30,
    opacity: 0.8,
  },
    header: {
      alignItems: 'center',
      marginBottom: 40,
    marginTop: screenWidth * 0.15,
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
  pricingContainer: {
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
      marginBottom: 16,
    },
    stepsContainer: {
      gap: 16,
    },
    step: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    stepNumber: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    stepNumberText: {
      fontSize: 16,
      fontFamily: 'Inter-Bold',
      color: theme.colors.surface,
    },
    stepText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: theme.colors.textSecondary,
      flex: 1,
    },
    actionsContainer: {
      marginBottom: 24,
    },
    referButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  referButtonGradient: {
    flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    gap: 8,
    },
    referButtonText: {
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
  codeContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  codeLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  code: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: theme.colors.primary,
    letterSpacing: 4,
    },
  });
