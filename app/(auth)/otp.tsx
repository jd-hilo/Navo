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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Shield, ArrowRight } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

export default function OTPScreen() {
  const { theme, isDark } = useTheme();
  const { signIn, signUp, resendOTP } = useAuth();
  const { email, isSignUp } = useLocalSearchParams<{ email: string; isSignUp: string }>();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  
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

  const handleOtpChange = (value: string, index: number) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
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
      const result = isSignUp === 'true' 
        ? await signUp(email, otpString)
        : await signIn(email, otpString);
      
      if (result.success) {
        // Navigation will be handled by the auth state change
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
      const result = await resendOTP(email);
      
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
    router.back();
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
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={handleBack}
              activeOpacity={0.7}>
              <ArrowLeft size={24} color={theme.colors.text} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Shield size={32} color={theme.colors.text} strokeWidth={2} />
            </View>

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
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[
                    styles.otpInput,
                    digit && styles.otpInputFilled,
                  ]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  editable={!isLoading}
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
          </View>

          {/* Verify Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.verifyButton, (!isOtpComplete || isLoading) && styles.verifyButtonDisabled]}
              onPress={handleVerify}
              disabled={!isOtpComplete || isLoading}
              activeOpacity={0.8}>
              <LinearGradient
                colors={
                  (!isOtpComplete || isLoading)
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
                      (!isOtpComplete || isLoading) && styles.buttonTextDisabled
                    ]}>
                      Verify & Continue
                    </Text>
                    <ArrowRight 
                      size={20} 
                      color={
                        (!isOtpComplete || isLoading) 
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
    textAlign: 'left',
  },
  emailText: {
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    textAlign: 'center',
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  otpInputFilled: {
    borderColor: theme.colors.text,
    borderWidth: 2,
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
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.text,
  },
  demoText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  demoCode: {
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
  },
  footer: {
    paddingBottom: Platform.OS === 'ios' ? 20 : 40,
  },
  verifyButton: {
    borderRadius: 16,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  verifyButtonDisabled: {
    shadowOpacity: 0.05,
    elevation: 2,
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
  buttonTextDisabled: {
    color: theme.colors.textSecondary,
  },
});