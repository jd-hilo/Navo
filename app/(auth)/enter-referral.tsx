import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/services/database';

const { width: screenWidth } = Dimensions.get('window');

export default function EnterReferralScreen() {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmitCode = async () => {
    // Validate code format (5 characters)
    if (!referralCode.trim() || referralCode.length !== 5) {
      Alert.alert(
        'Invalid Code',
        'Please enter a valid 5-character referral code.',
      );
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('use_referral_code', {
        code: referralCode.toUpperCase(),
        p_user_id: user?.id
      });

      if (error) {
        // Handle specific error messages from the database
        let errorMessage = 'Failed to process referral code. Please try again.';
        if (error.message.includes('Invalid referral code')) {
          errorMessage = 'This referral code does not exist.';
        } else if (error.message.includes('Cannot use your own referral code')) {
          errorMessage = 'You cannot use your own referral code.';
        } else if (error.message.includes('already used a referral code')) {
          errorMessage = 'You have already used a referral code.';
        } else if (error.message.includes('maximum uses')) {
          errorMessage = 'This referral code has reached its maximum uses (3).';
        }
        
        Alert.alert(
          'Error',
          errorMessage,
          [{ text: 'OK' }]
        );
        throw error;
      }

      if (data) {
        Alert.alert(
          'Success!',
          'You and your friend have each received 25 search credits!',
          [{ text: 'OK', onPress: () => router.push('/(auth)/upgrade') }]
        );
      }
    } catch (error) {
      console.error('Error processing referral code:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/(auth)/upgrade');
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
            <Text style={styles.title}>Have a{'\n'}Referral Code?</Text>
            <Text style={styles.subtitle}>
              Enter your friend's referral code and you'll both get 25 free search credits
            </Text>
          </View>

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                !referralCode && styles.placeholderStyle
              ]}
              value={referralCode}
              onChangeText={(text) => setReferralCode(text.toUpperCase())}
              placeholder="Enter referral code"
              placeholderTextColor={theme.colors.textSecondary}
              autoCapitalize="characters"
              maxLength={5}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!referralCode.trim() || referralCode.length !== 5) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmitCode}
              disabled={isLoading || !referralCode.trim() || referralCode.length !== 5}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#00E5FF', '#2F80ED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitButtonGradient}
              >
                <Text style={styles.submitButtonText}>Submit Code</Text>
                <ArrowRight size={20} color="#FFFFFF" strokeWidth={2} />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              activeOpacity={0.8}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
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
  inputContainer: {
    marginBottom: 32,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    fontSize: 24,
    fontFamily: 'Inter-Medium',
    color: theme.colors.text,
    textAlign: 'center',
    letterSpacing: 4,
    minWidth: 200,
  },
  placeholderStyle: {
    fontSize: 16,
    letterSpacing: 0,
    opacity: 0.5,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  submitButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    fontSize: 17,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    marginRight: 4,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 16,
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
}); 