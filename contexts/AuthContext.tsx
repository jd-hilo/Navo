import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { supabase } from '@/services/database';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, otp: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  sendOTP: (email: string) => Promise<{ success: boolean; error?: string }>;
  resendOTP: (email: string) => Promise<{ success: boolean; error?: string }>;
  checkEmailExists: (email: string) => Promise<boolean>;
  signInWithOtp: (email: string) => Promise<{ data: any; error: any }>;
  signInWithPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithApple: (user: any) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function to generate a valid UUID v4
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Helper function to validate UUID format
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from storage on app start
  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        
        // Validate that the user ID is a proper UUID
        if (parsedUser.id && isValidUUID(parsedUser.id)) {
          setUser(parsedUser);
          console.log('✅ User loaded from storage:', parsedUser.email);
        } else {
          console.log('❌ Invalid UUID format in stored user data, clearing storage');
          // Clear invalid user data
          await removeUserFromStorage();
          setUser(null);
        }
      } else {
        console.log('❌ No user found in storage');
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
      // Clear potentially corrupted data
      await removeUserFromStorage();
      setUser(null);
    } finally {
      // Always set loading to false, even if there was an error
      setIsLoading(false);
    }
  };

  const saveUserToStorage = async (userData: User) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      console.log('💾 User saved to storage:', userData.email);
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  };

  const removeUserFromStorage = async () => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('recentSearches');
      await AsyncStorage.removeItem('savedSearches');
      console.log('🗑️ User data removed from storage');
    } catch (error) {
      console.error('Error removing user from storage:', error);
    }
  };

  const sendOTP = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Sending OTP to:', email);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        console.error('Error sending OTP:', error.message);
        return { success: false, error: error.message };
      }

      console.log('OTP sent successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Unexpected error in sendOTP:', error);
      return { success: false, error: error.message || 'Failed to send OTP.' };
    }
  };

  const resendOTP = async (email: string): Promise<{ success: boolean; error?: string }> => {
    return await sendOTP(email);
  };
  const signInWithApple = async (user: any): Promise<{ success: boolean; error?: string }> => {
    try {
      const userData: User = {
        id: user.id,
        email:  user.email  ,
        name:  user.name || user.email.split('@')[0],
        };
        setUser(userData);
        await saveUserToStorage(userData);
      // Ensure user profile exists
      await ensureUserProfile(user.id);
      return { success: true };
      
    } catch (error) {
      console.error('Error signing in with Apple:', error);
      return { success: false, error: error as string || 'Sign in failed.' };
    }
   
  }

  const signIn = async (email: string, otp: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
          email,
        token: otp,
        type: 'email',
      });
      if (error || !data.user) {
        return { success: false, error: error?.message || 'Invalid OTP.' };
      }
      const userData: User = {
        id: data.user.id,
        email: data.user.email ?? email,
        name: data.user.user_metadata?.name || email.split('@')[0],
        };
        setUser(userData);
        await saveUserToStorage(userData);
      // Ensure user profile exists
      await ensureUserProfile(data.user.id);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Sign in failed.' };
    }
  };

  const signUp = async (email: string, otp: string, name?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Supabase sign up with OTP is the same as sign in, so we just verify the OTP
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });
      if (error || !data.user) {
        return { success: false, error: error?.message || 'Invalid OTP.' };
      }
        const userData: User = {
        id: data.user.id,
        email: data.user.email ?? email,
        name: name || data.user.user_metadata?.name || email.split('@')[0],
        };
        setUser(userData);
        await saveUserToStorage(userData);
      // Ensure user profile exists
      await ensureUserProfile(data.user.id);
        return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Sign up failed.' };
    }
  };

  // Helper to ensure user profile exists
  const ensureUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
      if (!data) {
        // Create profile if not exists
        await supabase.from('user_profiles').insert([{ user_id: userId }]);
      }
    } catch (error) {
      // Ignore errors for now
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      console.log('🚪 Starting sign out process...');
      
      // Sign out from Supabase first
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.warn('⚠️ Supabase sign out error:', signOutError);
      }
      
      // Clear user state immediately for better UX
      setUser(null);
      
      // Remove all user data from storage
      await removeUserFromStorage();
      
      console.log('✅ Sign out successful, navigating to welcome screen');
      
      // Use router.replace to ensure clean navigation
      try {
        router.replace('/(auth)/welcome');
      } catch (navError) {
        console.warn('⚠️ Navigation error, trying fallback:', navError);
        // Fallback navigation
        setTimeout(() => {
          router.replace('/(auth)/welcome');
        }, 100);
      }
      
    } catch (error) {
      console.error('❌ Sign out error:', error);
      // Even if there's an error, still clear the user state and navigate
      setUser(null);
      try {
        router.replace('/(auth)/welcome');
      } catch (navError) {
        console.error('❌ Critical navigation error:', navError);
        // Force reload as last resort
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      }
    }
  };

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      });
      
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          return true; // Email exists but not confirmed
        }
        if (error.message.includes('Email not found')) {
          return false; // Email doesn't exist
        }
        throw error;
      }
      
      return true; // Email exists and OTP sent successfully
    } catch (error) {
      console.error('Error checking email:', error);
      throw error;
    }
  };

  const signInWithOtp = async (email: string): Promise<{ data: any; error: any }> => {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({ email });
      if (error) {
        return { data: null, error: error.message };
      }
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  };

  const signInWithPassword = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) {
        return { success: false, error: error?.message || 'Invalid email or password.' };
      }
      const userData: User = {
        id: data.user.id,
        email: data.user.email ?? email,
        name: data.user.user_metadata?.name || email.split('@')[0],
      };
      setUser(userData);
      await saveUserToStorage(userData);
      await ensureUserProfile(data.user.id);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Sign in failed.' };
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    sendOTP,
    resendOTP,
    checkEmailExists,
    signInWithOtp,
    signInWithPassword,
    signInWithApple,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};