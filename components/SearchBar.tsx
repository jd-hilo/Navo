import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  placeholder?: string;
}

const ANIMATED_PLACEHOLDERS = [
  "Who won the NBA finals?",
  "How to fix a flat tire",
  "Best restaurants near me",
  "React Native tutorials",
  "Weather forecast today",
  "Machine learning basics",
  "Travel tips for Europe",
  "Healthy dinner recipes",
  "Latest tech news",
  "Python programming guide"
];

export default function SearchBar({
  value,
  onChangeText,
  onClear,
  placeholder = 'Search...',
}: SearchBarProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [currentPlaceholder, setCurrentPlaceholder] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  
  const cursorOpacity = useRef(new Animated.Value(1)).current;
  
  const typingSpeed = 80; // ms per character
  const deletingSpeed = 40; // ms per character
  const pauseTime = 3000; // ms to pause between phrases
  const cursorBlinkSpeed = 500; // ms for cursor blink

  // Cursor blinking animation
  useEffect(() => {
    if (value.length > 0 || isFocused) return;
    
    const blinkCursor = () => {
      Animated.sequence([
        Animated.timing(cursorOpacity, {
          toValue: 0,
          duration: cursorBlinkSpeed,
          useNativeDriver: true,
        }),
        Animated.timing(cursorOpacity, {
          toValue: 1,
          duration: cursorBlinkSpeed,
          useNativeDriver: true,
        }),
      ]).start(() => blinkCursor());
    };
    
    blinkCursor();
  }, [value, cursorOpacity, isFocused]);

  useEffect(() => {
    if (value.length > 0 || isFocused) {
      // If user is typing or focused, stop the animation
      setCurrentPlaceholder('');
      setIsTyping(false);
      setIsDeleting(false);
      return;
    }

    let timeoutId: NodeJS.Timeout;

    const animatePlaceholder = async () => {
      const currentText = ANIMATED_PLACEHOLDERS[currentPlaceholderIndex];
      
      // Type out the text
      setIsTyping(true);
      setIsDeleting(false);
      setCurrentPlaceholder('');
      
      for (let i = 0; i <= currentText.length; i++) {
        if (value.length > 0 || isFocused) return; // Stop if user starts typing or focuses
        setCurrentPlaceholder(currentText.substring(0, i));
        await new Promise(resolve => {
          timeoutId = setTimeout(resolve, typingSpeed);
        });
      }
      
      // Pause at the end
      await new Promise(resolve => {
        timeoutId = setTimeout(resolve, pauseTime);
      });
      
      if (value.length > 0 || isFocused) return; // Check again after pause
      
      // Delete the text
      setIsTyping(false);
      setIsDeleting(true);
      
      for (let i = currentText.length; i >= 0; i--) {
        if (value.length > 0 || isFocused) return; // Stop if user starts typing or focuses
        setCurrentPlaceholder(currentText.substring(0, i));
        await new Promise(resolve => {
          timeoutId = setTimeout(resolve, deletingSpeed);
        });
      }
      
      if (value.length > 0 || isFocused) return; // Check again after deletion
      
      // Move to next placeholder
      setCurrentPlaceholderIndex((prev) => (prev + 1) % ANIMATED_PLACEHOLDERS.length);
    };

    animatePlaceholder();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [currentPlaceholderIndex, value, isFocused]);

  const displayPlaceholder = value.length > 0 ? placeholder : currentPlaceholder;

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Search size={18} color={theme.colors.textSecondary} strokeWidth={2} style={styles.searchIcon} />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder={displayPlaceholder}
            placeholderTextColor={theme.colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="never"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {value.length === 0 && !isFocused && (
            <Animated.View 
              style={[
                styles.cursor,
                { 
                  opacity: cursorOpacity,
                  left: (currentPlaceholder.length * 8) + 28, // Adjusted character width
                }
              ]} 
            />
          )}
        </View>
        {value.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={onClear}>
            <X size={16} color={theme.colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    width: '100%',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.searchBar,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === 'ios' ? 13.2 : 11, // Increased by 10%
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: theme.colors.searchBarBorder,
  },
  searchIcon: {
    marginRight: 10,
  },
  inputContainer: {
    flex: 1,
    position: 'relative',
  },
  input: {
    fontSize: 16.5,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text,
    paddingVertical: 0,
    paddingRight: 0,
    letterSpacing: -0.3, // Added to reduce letter spacing
  },
  cursor: {
    position: 'absolute',
    top: 2,
    width: 2,
    height: 20,
    backgroundColor: theme.colors.textSecondary,
    borderRadius: 1,
  },
  clearButton: {
    padding: 4,
    marginLeft: 6,
  },
});