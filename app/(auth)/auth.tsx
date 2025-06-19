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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Mail, Shield, ArrowRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthScreen() {
  const { theme, isDark } = useTheme();
  const { sendOTP, signIn, signUp, checkEmailExists, signInWithOtp } = useAuth();
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
        router.replace('/(tabs)');
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

  const isOtpComplete = otp.every(digit => digit !== '');

  const styles = createStyles(theme);

  return (
    <LinearGradient
      colors={isDark ? ['#0F0F0F', '#1A1A1A', '#0F0F0F'] : ['#F7F7F5', '#FFFFFF', '#F7F7F5']}
      style={styles.container}>
      
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={handleBack}
              activeOpacity={0.7}>
              <ArrowLeft size={24} color={theme.colors.text} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                {showOtp ? (
                  <Shield size={32} color={theme.colors.text} strokeWidth={2} />
                ) : (
                  <Mail size={32} color={theme.colors.text} strokeWidth={2} />
                )}
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
                            color: theme.colors.text
                          }
                        ]}
                        value={digit}
                        onChangeText={(text) => handleOtpChange(text, index)}
                        onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                        keyboardType="number-pad"
                        maxLength={1}
                        selectTextOnFocus
                      />
                    ))}
                  </View>

                  {/* Resend Code */}
                  <View style={styles.resendContainer}>
                    <Text style={styles.resendText}>Didn't receive the code?</Text>
                    <TouchableOpacity 
                      onPress={handleResendOTP}
                      disabled={!canResend || isResending}
                      activeOpacity={0.7}>
                      <Text style={[
                        styles.resendLink,
                        (!canResend || isResending) && styles.resendLinkDisabled
                      ]}>
                        {isResending ? 'Sending...' : canResend ? 'Resend Code' : `Resend in ${countdown}s`}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Demo Helper */}
                  <View style={styles.demoContainer}>
                    <Text style={styles.demoText}>
                      For demo purposes, use: <Text style={styles.demoCode}>123456</Text> or any code starting with <Text style={styles.demoCode}>1</Text>
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.title}>Welcome to Navo</Text>
                  
                  <Text style={styles.subtitle}>
                    Enter your email to get started
                  </Text>

                  {/* Email Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Email Address</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter your email"
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

          {/* Footer Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.button,
                showOtp 
                  ? (!isOtpComplete || isLoading) && styles.buttonDisabled
                  : (!email.trim() || isLoading) && styles.buttonDisabled
              ]}
              onPress={showOtp ? handleVerify : handleEmailSubmit}
              disabled={
                showOtp 
                  ? !isOtpComplete || isLoading
                  : !email.trim() || isLoading
              }
              activeOpacity={0.8}>
              <LinearGradient
                colors={
                  (showOtp 
                    ? (!isOtpComplete || isLoading)
                    : (!email.trim() || isLoading))
                    ? [theme.colors.border, theme.colors.border]
                    : isDark 
                      ? ['#FFFFFF', '#F0F0F0'] 
                      : ['#000000', '#333333']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}>
                {isLoading ? (
                  <ActivityIndicator 
                    size="small" 
                    color={isDark ? '#000000' : '#FFFFFF'} 
                  />
                ) : (
                  <>
                    <Text style={[
                      styles.buttonText,
                      (showOtp 
                        ? (!isOtpComplete || isLoading)
                        : (!email.trim() || isLoading)) && styles.buttonTextDisabled
                    ]}>
                      {showOtp ? 'Verify & Continue' : 'Continue'}
                    </Text>
                    <ArrowRight 
                      size={20} 
                      color={
                        (showOtp 
                          ? (!isOtpComplete || isLoading)
                          : (!email.trim() || isLoading))
                          ? theme.colors.textSecondary
                          : isDark ? '#000000' : '#FFFFFF'
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

const createStyles = (theme: any) => StyleSheet.create({
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
    paddingBottom: 24,
  },
  content: {
    flex: 1,
    paddingTop: 32,
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
    marginBottom: 12,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    fontSize: 16,
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
    paddingBottom: Platform.OS === 'ios' ? 32 : 48,
  },
  button: {
    borderRadius: 16,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
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
  buttonTextDisabled: {
    color: theme.colors.textSecondary,
  },
}); 