import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  KeyboardAvoidingViewProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Mail, Shield, ArrowRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '@/services/database';

export default function AuthScreen() {
  const { theme, isDark } = useTheme();
  const { sendOTP, signIn, signUp, checkEmailExists, signInWithOtp ,signInWithApple} =
    useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [emailExists, setEmailExists] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailSubmit = async () => {
    if (!validateEmail(email)) return;

    // Special case: route to password screen for apple@test.com
    if (email.trim().toLowerCase() === 'apple@test.com') {
      router.push('/(auth)/password');
      return;
    }
    setIsLoading(true);
    try {
      console.log('Attempting to send OTP to:', email);
      const { success, error } = await sendOTP(email);

      if (error) {
        console.error('OTP send error:', error);
        throw new Error(error);
      }

      if (success) {
        console.log('OTP sent successfully');
        setEmailExists(true);
        setShowOtp(true);
        setOtp(['', '', '', '', '', '']);
        setCountdown(30);
        setCanResend(false);
      } else {
        console.log('OTP send failed, attempting to create new account');
        const { error: signUpError } = await signInWithOtp(email);
        if (signUpError) {
          console.error('Sign up error:', signUpError);
          throw new Error(signUpError.message);
        }
        setEmailExists(false);
        setShowOtp(true);
        setOtp(['', '', '', '', '', '']);
        setCountdown(30);
        setCanResend(false);
      }
    } catch (error: any) {
      console.error('Error in email submit:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to process email. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-advance to next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      // Clear previous input and focus it
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');

    if (otpString.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);

    try {
      const result = isExistingUser
        ? await signIn(email, otpString)
        : await signUp(email, otpString);

      if (result.success) {
        // Route new users to enter-referral screen, existing users to home
        if (isExistingUser) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/enter-referral');
        }
      } else {
        Alert.alert('Error', result.error || 'Invalid verification code');
        // Clear OTP on error
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);

    try {
      const result = await sendOTP(email);

      if (result.success) {
        setCountdown(30);
        setCanResend(false);
        Alert.alert('Success', 'Verification code sent successfully');
      } else {
        Alert.alert('Error', result.error || 'Failed to resend code');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleBack = () => {
    if (showOtp) {
      setShowOtp(false);
      setOtp(['', '', '', '', '', '']);
    } else {
      router.back();
    }
  };

  const isOtpComplete = otp.every((digit) => digit !== '');

  const styles = createStyles(theme);

  return (
    <LinearGradient
      colors={
        isDark
          ? ['#0F0F0F', '#1A1A1A', '#0F0F0F']
          : ['#F7F7F5', '#FFFFFF', '#F7F7F5']
      }
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
          enabled
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <ArrowLeft size={24} color={theme.colors.text} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            <View style={[styles.content, { paddingBottom: Platform.OS === 'ios' ? 40 : 60 }]}>
              {/* Stars Container */}
              <View style={styles.starsContainer}>
                <Image 
                  source={require('@/assets/images/blue.png')}
                  style={[styles.star, styles.blueStar]}
                  resizeMode="contain"
                />
                <Image 
                  source={require('@/assets/images/organge star.png')}
                  style={[styles.star, styles.orangeStar]}
                  resizeMode="contain"
                />
              </View>

              {showOtp ? (
                <>
                  <Text style={styles.title}>Verify Your Email</Text>
                  <Text style={styles.subtitle}>
                    We've sent a 6-digit verification code to{'\n'}
                    <Text style={styles.emailText}>{email}</Text>
                  </Text>

                  {/* OTP Input */}
                  <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => {
                          inputRefs.current[index] = ref;
                        }}
                        style={[
                          styles.otpInput,
                          {
                            backgroundColor: theme.colors.card,
                            borderColor: theme.colors.border,
                            color: theme.colors.text,
                          },
                        ]}
                        value={digit}
                        onChangeText={(text) => handleOtpChange(text, index)}
                        onKeyPress={({ nativeEvent }) =>
                          handleKeyPress(nativeEvent.key, index)
                        }
                        keyboardType="number-pad"
                        maxLength={1}
                        selectTextOnFocus
                      />
                    ))}
                  </View>

                  {/* Resend Code */}
                  <View style={styles.resendContainer}>
                    <Text style={styles.resendText}>
                      Didn't receive the code?
                    </Text>
                    <TouchableOpacity
                      onPress={handleResendOTP}
                      disabled={!canResend || isResending}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.resendLink,
                          (!canResend || isResending) &&
                          styles.resendLinkDisabled,
                        ]}
                      >
                        {isResending
                          ? 'Sending...'
                          : canResend
                          ? 'Resend Code'
                          : `Resend in ${countdown}s`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.title}>Enter your email</Text>
                  <Text style={styles.subtitle}>
                    We will send a code to sign you in or create an account
                  </Text>

                  {/* Email Input */}
                  <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="your@email.com"
                        placeholderTextColor={theme.colors.textSecondary}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="email"
                        editable={!isLoading}
                      />
                    </View>
                  </View>
                </>
              )}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={16}
              style={styles.appleButton}
              onPress={async () => {
                try {
                  const credential = await AppleAuthentication.signInAsync({
                    requestedScopes: [
                      AppleAuthentication.AppleAuthenticationScope
                        .FULL_NAME,
                      AppleAuthentication.AppleAuthenticationScope.EMAIL,
                    ],
                  });
                  // Sign in via Supabase Auth.
                  if (credential.identityToken) {
                    const {
                      error,
                      data: { user },
                    } = await supabase.auth.signInWithIdToken({
                      provider: 'apple',
                      token: credential.identityToken,
                    });
                    console.log(JSON.stringify({ error, user }, null, 2));
                    if (!error) {
                       const result = await signInWithApple(user);
                       if (result.success) {
                        router.replace('/(tabs)');
                       } else {
                        Alert.alert('Error', result.error || 'Failed to sign in with Apple');
                       }
                    }
                  } else {
                    throw new Error('No identityToken.');
                  }
                } catch (e) {
                  console.log("error :",e)
                }
              }}
            />

            <TouchableOpacity
              style={[
                styles.button,
                showOtp
                  ? (!isOtpComplete || isLoading) && styles.buttonDisabled
                  : (!email.trim() || isLoading) && styles.buttonDisabled,
              ]}
              onPress={showOtp ? handleVerify : handleEmailSubmit}
              disabled={
                showOtp
                  ? !isOtpComplete || isLoading
                  : !email.trim() || isLoading
              }
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  (!email.trim() || isLoading)
                    ? [theme.colors.border, theme.colors.border]
                    : ['#00E5FF', '#2F80ED']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={isDark ? '#000000' : '#FFFFFF'}
                  />
                ) : (
                  <>
                    <Text
                      style={[
                        styles.buttonText,
                        (!email.trim() || isLoading) && styles.buttonTextDisabled,
                      ]}
                    >
                      Continue
                    </Text>
                    <ArrowRight
                      size={20}
                      color={
                        (!email.trim() || isLoading)
                          ? theme.colors.textSecondary
                          : '#FFFFFF'
                      }
                      strokeWidth={2}
                    />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    keyboardView: {
      flex: 1,
      paddingHorizontal: 24,
    },
    header: {
      paddingTop: 16,
      paddingBottom: 24,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    content: {
      flex: 1,
      paddingTop: 80,
      position: 'relative',
    },
    starsContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 80,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
    },
    star: {
      width: 40,
      height: 40,
    },
    blueStar: {
      transform: [{ translateX: -20 }, { translateY: 10 }],
    },
    orangeStar: {
      transform: [{ translateX: 20 }, { translateY: -10 }],
    },
    iconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    title: {
      fontSize: 28,
      fontFamily: 'Inter-Bold',
      color: theme.colors.text,
      marginBottom: 8,
      lineHeight: 34,
    },
    subtitle: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: theme.colors.textSecondary,
      lineHeight: 22,
      marginBottom: 24,
    },
    inputContainer: {
      marginTop: 8,
    },
    inputWrapper: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    input: {
      fontSize: 17,
      fontFamily: 'Inter-Regular',
      color: theme.colors.text,
      padding: 0,
    },
    otpContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    otpInput: {
      width: 48,
      height: 56,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      fontSize: 20,
      fontFamily: 'Inter-SemiBold',
      color: theme.colors.text,
      textAlign: 'center',
    },
    otpInputFilled: {
      borderColor: theme.colors.text,
    },
    resendContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    resendText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: theme.colors.textSecondary,
      marginRight: 4,
    },
    resendLink: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: theme.colors.text,
    },
    resendLinkDisabled: {
      color: theme.colors.textSecondary,
    },
    demoContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
    },
    demoText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    demoCode: {
      fontFamily: 'Inter-SemiBold',
      color: theme.colors.text,
    },
    emailText: {
      fontFamily: 'Inter-SemiBold',
      color: theme.colors.text,
    },
    footer: {
      paddingTop: 12,
      backgroundColor: theme.colors.background,
    },
    appleButton: {
      width: '100%',
      height: 56,
      marginBottom: 12,
    },
    button: {
      width: '100%',
      height: 56,
      borderRadius: 16,
      overflow: 'hidden',
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonGradient: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    buttonText: {
      fontSize: 17,
      fontFamily: 'Inter-Medium',
      color: '#FFFFFF',
      marginRight: 4,
    },
    buttonTextDisabled: {
      color: theme.colors.textSecondary,
    },
  });
