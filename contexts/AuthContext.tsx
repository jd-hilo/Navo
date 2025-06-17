import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

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
      console.log(`📧 Sending OTP to ${email}`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, this would call your backend API to send OTP
      // For demo purposes, always return success
      console.log(`✅ OTP sent successfully to ${email}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error sending OTP:', error);
      return { 
        success: false, 
        error: 'Failed to send OTP. Please try again.' 
      };
    }
  };

  const resendOTP = async (email: string): Promise<{ success: boolean; error?: string }> => {
    console.log(`🔄 Resending OTP to ${email}`);
    return await sendOTP(email);
  };

  const signIn = async (email: string, otp: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log(`🔐 Attempting sign in for ${email} with OTP: ${otp}`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real app, this would verify OTP with your backend
      // For demo: accept 123456, 000000, or any 6-digit code starting with 1
      const validOTPs = ['123456', '000000'];
      const isValidOTP = validOTPs.includes(otp) || (otp.length === 6 && otp.startsWith('1'));
      
      if (isValidOTP) {
        const userData: User = {
          id: generateUUID(),
          email,
          name: email.split('@')[0],
        };
        
        setUser(userData);
        await saveUserToStorage(userData);
        
        console.log(`✅ Sign in successful for ${email}`);
        return { success: true };
      } else {
        console.log(`❌ Invalid OTP for ${email}: ${otp}`);
        return { 
          success: false, 
          error: 'Invalid OTP. Please try again. (Demo: use 123456)' 
        };
      }
    } catch (error) {
      console.error('❌ Sign in error:', error);
      return { 
        success: false, 
        error: 'Sign in failed. Please try again.' 
      };
    }
  };

  const signUp = async (email: string, otp: string, name?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log(`📝 Attempting sign up for ${email} with OTP: ${otp}`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real app, this would verify OTP and create account with your backend
      // For demo: accept 123456, 000000, or any 6-digit code starting with 1
      const validOTPs = ['123456', '000000'];
      const isValidOTP = validOTPs.includes(otp) || (otp.length === 6 && otp.startsWith('1'));
      
      if (isValidOTP) {
        const userData: User = {
          id: generateUUID(),
          email,
          name: name || email.split('@')[0],
        };
        
        setUser(userData);
        await saveUserToStorage(userData);
        
        console.log(`✅ Sign up successful for ${email}`);
        return { success: true };
      } else {
        console.log(`❌ Invalid OTP for ${email}: ${otp}`);
        return { 
          success: false, 
          error: 'Invalid OTP. Please try again. (Demo: use 123456)' 
        };
      }
    } catch (error) {
      console.error('❌ Sign up error:', error);
      return { 
        success: false, 
        error: 'Sign up failed. Please try again.' 
      };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      console.log('🚪 Starting sign out process...');
      
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

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    sendOTP,
    resendOTP,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};