import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

export interface Theme {
  colors: {
    background: string;
    surface: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
    success: string;
    warning: string;
    error: string;
    shadow: string;
    tabBar: string;
    tabBarBorder: string;
    searchBar: string;
    searchBarBorder: string;
    loadingLine: string;
    warningBackground: string;
    warningBorder: string;
    warningText: string;
    sourceBackground: string;
    usageBorder: string;
    actionButton: string;
    retryButton: string;
    expandButton: string;
    indicator: {
      webSearch: string;
      webSearchText: string;
      error: string;
      errorText: string;
      fallback: string;
      fallbackText: string;
    };
  };
  gradients: {
    gemini: string[];
    tiktok: string[];
    reddit: string[];
    pinterest: string[];
  };
}

const lightTheme: Theme = {
  colors: {
    background: '#F7F7F5',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    text: '#000000',
    textSecondary: '#6B6B6B',
    border: '#E0E0E0',
    primary: '#000000',
    success: '#10B981',
    warning: '#F97316',
    error: '#EF4444',
    shadow: '#000000',
    tabBar: '#FFFFFF',
    tabBarBorder: '#E0E0E0',
    searchBar: '#FFFFFF',
    searchBarBorder: '#E0E0E0',
    loadingLine: '#F0F0F0',
    warningBackground: '#FFF7ED',
    warningBorder: '#F97316',
    warningText: '#9A3412',
    sourceBackground: '#F8FAFC',
    usageBorder: '#F0F0F0',
    actionButton: 'transparent',
    retryButton: '#F7F7F5',
    expandButton: 'transparent',
    indicator: {
      webSearch: '#EFF6FF',
      webSearchText: '#3B82F6',
      error: '#EF4444',
      errorText: '#FFFFFF',
      fallback: '#F97316',
      fallbackText: '#FFFFFF',
    },
  },
  gradients: {
    gemini: ['#FF8FA3', '#FFC285', '#C285FF'],
    tiktok: ['#FFC285', '#C285FF', '#FF8FA3'],
    reddit: ['#C285FF', '#FF8FA3', '#FFC285'],
    pinterest: ['#FF8FA3', '#C285FF', '#FFC285'],
  },
};

const darkTheme: Theme = {
  colors: {
    background: '#0F0F0F',
    surface: '#1A1A1A',
    card: '#1A1A1A',
    text: '#FFFFFF',
    textSecondary: '#A1A1AA',
    border: '#2A2A2A',
    primary: '#FFFFFF',
    success: '#10B981',
    warning: '#F97316',
    error: '#EF4444',
    shadow: '#000000',
    tabBar: '#1A1A1A',
    tabBarBorder: '#2A2A2A',
    searchBar: '#1A1A1A',
    searchBarBorder: '#2A2A2A',
    loadingLine: '#2A2A2A',
    warningBackground: '#2A1810',
    warningBorder: '#F97316',
    warningText: '#FED7AA',
    sourceBackground: '#262626',
    usageBorder: '#2A2A2A',
    actionButton: 'transparent',
    retryButton: '#262626',
    expandButton: 'transparent',
    indicator: {
      webSearch: '#1E3A8A',
      webSearchText: '#60A5FA',
      error: '#EF4444',
      errorText: '#FFFFFF',
      fallback: '#F97316',
      fallbackText: '#FFFFFF',
    },
  },
  gradients: {
    gemini: ['#FF6B8A', '#FFA366', '#A366FF'],
    tiktok: ['#FFA366', '#A366FF', '#FF6B8A'],
    reddit: ['#A366FF', '#FF6B8A', '#FFA366'],
    pinterest: ['#FF6B8A', '#A366FF', '#FFA366'],
  },
};

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDark, setIsDark] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme !== null) {
        setIsDark(savedTheme === 'dark');
      } else {
        setIsDark(true);
        saveThemePreference(true);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveThemePreference = async (darkMode: boolean) => {
    try {
      await AsyncStorage.setItem('theme', darkMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    saveThemePreference(newTheme);
  };

  const setTheme = (darkMode: boolean) => {
    setIsDark(darkMode);
    saveThemePreference(darkMode);
  };

  const theme = isDark ? darkTheme : lightTheme;

  // Don't render children until theme is loaded
  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {children}
    </ThemeContext.Provider>
  );
};
