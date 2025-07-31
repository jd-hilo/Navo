import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Platform,
  Keyboard,
  Dimensions,
  Image,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AnimatedSearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

const AnimatedSearchBar = ({ onSearch, placeholder = "Search...", value, onValueChange }: AnimatedSearchBarProps) => {
  const { theme, isDark } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value || '');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // Animation values
  const animation = useRef(new Animated.Value(0)).current;
  const positionAnimation = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  // Listen for keyboard events
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow?.remove();
      keyboardWillHide?.remove();
    };
  }, []);

  const toggleSearch = () => {
    if (isExpanded) {
      // Collapse search bar
      Keyboard.dismiss();
      Animated.parallel([
        Animated.timing(animation, {
          toValue: 0,
          duration: 150,
          useNativeDriver: false,
          easing: Easing.ease,
        }),
        Animated.timing(positionAnimation, {
          toValue: 0,
          duration: 150,
          useNativeDriver: false,
          easing: Easing.ease,
        }),
      ]).start(() => {
        setIsExpanded(false);
        setSearchQuery('');
        if (onSearch) onSearch('');
      });
    } else {
      // Expand search bar
      setIsExpanded(true);
      Animated.parallel([
        Animated.timing(animation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: false,
          easing: Easing.ease,
        }),
        Animated.timing(positionAnimation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: false,
          easing: Easing.ease,
        }),
      ]).start(() => {
        inputRef.current?.focus();
      });
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (onValueChange) onValueChange(text);
    // Remove the automatic onSearch call - only call onSearch when user submits
  };

  const handleSubmit = () => {
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleClose = () => {
    // Clear the search text
    setSearchQuery('');
    if (onValueChange) onValueChange('');
    if (onSearch) onSearch('');
    // Close the search bar with smooth animation
    if (isExpanded) {
      Animated.timing(animation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        setIsExpanded(false);
      });
    }
  };

  const widthInterpolated = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [56, screenWidth - 40], // from icon size to full width minus margins
  });

  const translateXInterpolated = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [-28, -(screenWidth - 40) / 2], // from centered to left-aligned
  });

  const bottomPosition = positionAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 40], // stay at bottom center
  });

  const styles = createStyles(theme);

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          width: widthInterpolated,
          bottom: bottomPosition,
          transform: [{ translateX: translateXInterpolated }],
        },
      ]}
    >
      {isExpanded ? (
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          value={value !== undefined ? value : searchQuery}
          onChangeText={handleSearch}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={handleSubmit}
        />
      ) : null}

      <TouchableOpacity onPress={toggleSearch} style={styles.iconWrapper}>
        {isExpanded ? (
          <TouchableOpacity onPress={handleClose} style={styles.searchButton}>
            <X size={24} color={theme.colors.text} strokeWidth={2} />
          </TouchableOpacity>
        ) : (
          <Image 
            source={require('../assets/images/magnifying glass.png')}
            style={{ 
              width: 40, 
              height: 40, 
              tintColor: theme.colors.text,
              marginLeft: -30,
            }}
            resizeMode="contain"
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    position: 'absolute',
    left: '50%',
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,

  },
  input: {
    flex: 1,
    color: theme.colors.text,
    paddingHorizontal: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    height: '100%',
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    display: 'flex',
  },
  searchButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AnimatedSearchBar; 