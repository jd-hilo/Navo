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
import { X, Search } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import FilterBar, { FilterType } from './FilterBar';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AnimatedSearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  onFilterChange?: (filter: FilterType) => void;
  currentFilter?: FilterType;
  showFilters?: boolean;
  onExpandedChange?: (isExpanded: boolean) => void;
}

const AnimatedSearchBar = ({ 
  onSearch, 
  placeholder = "Search...", 
  value, 
  onValueChange,
  onFilterChange,
  currentFilter = 'all',
  showFilters = false,
  onExpandedChange
}: AnimatedSearchBarProps) => {
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

  // Notify parent when expanded state changes
  useEffect(() => {
    if (onExpandedChange) {
      onExpandedChange(isExpanded);
    }
  }, [isExpanded, onExpandedChange]);

  const toggleSearch = () => {
    if (isExpanded) {
      // Collapse search bar
      Keyboard.dismiss();
      Animated.parallel([
        Animated.timing(animation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(positionAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
          easing: Easing.out(Easing.cubic),
        }),
      ]).start(() => {
        setIsExpanded(false);
        setSearchQuery('');
        if (onSearch) onSearch('');
      });
    } else {
      // Expand search bar with bouncy animation
      setIsExpanded(true);
      // Focus immediately to open keyboard right away
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50); // Small delay to ensure component is rendered
      
      Animated.parallel([
        Animated.spring(animation, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: false,
        }),
        Animated.spring(positionAnimation, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: false,
        }),
      ]).start();
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
    outputRange: [40, keyboardHeight > 0 ? keyboardHeight + 15 : 40], // 15px above keyboard when expanded
  });

  const styles = createStyles(theme, isDark);

  return (
    <>
      <FilterBar
        onFilterChange={onFilterChange || (() => {})}
        currentFilter={currentFilter}
        visible={showFilters && isExpanded}
      />
      <Animated.View 
        style={[
          styles.container,
          {
            width: widthInterpolated,
            bottom: bottomPosition,
            transform: [{ translateX: translateXInterpolated }],
            paddingHorizontal: isExpanded ? 16 : 0, // Remove padding when collapsed
          },
        ]}
      >
        {!isExpanded ? (
          <TouchableOpacity onPress={toggleSearch} style={styles.fullContainer}>
            <Search 
              size={24} 
              color={isDark ? "#FFFFFF" : "#000000"} 
              strokeWidth={3}
            />
          </TouchableOpacity>
        ) : (
          <>
            <View style={styles.searchIcon}>
              <Search 
                size={24} 
                color={isDark ? "#FFFFFF" : "#000000"} 
                strokeWidth={3}
              />
            </View>
            
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

            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={theme.colors.textSecondary} strokeWidth={3} />
            </TouchableOpacity>
          </>
        )}
      </Animated.View>
    </>
  );
};

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    position: 'absolute',
    left: '50%',
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.searchBar,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1000,
  },
  searchIcon: {
    marginRight: 12,
  },
  fullContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  input: {
    flex: 1,
    color: theme.colors.text,
    paddingHorizontal: 0,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    height: '100%',
    textShadowColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(128, 128, 128, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginLeft: 8,
  },
});

export default AnimatedSearchBar; 