import React, { useState } from 'react';
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
import { ArrowLeft, Lock, ArrowRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PasswordScreen() {
  const { theme, isDark } = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('apple@test.com');
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAuth() as any; // for direct user state update

  const handleBack = () => {
    router.back();
  };

  const handleSignIn = async () => {
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error || !data.user) {
        Alert.alert('Error', error?.message || 'Invalid email or password');
        setPassword('');
        return;
      }
      // Set user state and save to storage (mimic AuthContext signIn)
      const userData = {
        id: data.user.id,
        email: data.user.email ?? email,
        name: data.user.user_metadata?.name || email.split('@')[0],
      };
      if (setUser) setUser(userData);
      try {
        await AsyncStorage.setItem('user', JSON.stringify(userData));
      } catch {}
      // Route to index page
      router.replace('/');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Sign in failed.');
    } finally {
      setIsLoading(false);
    }
  };

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
              <Lock size={32} color={theme.colors.text} strokeWidth={2} />
            </View>
            <Text style={styles.title}>Sign In with Password</Text>
            <Text style={styles.subtitle}>Enter your password for apple@test.com</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.colors.textSecondary}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
            </View>
          </View>
          {/* Footer Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, (!password || isLoading) && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={!password || isLoading}
              activeOpacity={0.8}>
              <LinearGradient
                colors={(!password || isLoading)
                  ? [theme.colors.border, theme.colors.border]
                  : isDark
                    ? ['#FFFFFF', '#F0F0F0']
                    : ['#000000', '#333333']}
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
                      (!password || isLoading) && styles.buttonTextDisabled,
                    ]}>
                      Sign In
                    </Text>
                    <ArrowRight
                      size={20}
                      color={(!password || isLoading)
                        ? theme.colors.textSecondary
                        : isDark ? '#000000' : '#FFFFFF'}
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