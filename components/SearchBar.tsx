import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChangeText,
  onClear,
  placeholder = 'Search...',
}: SearchBarProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Search size={18} color={theme.colors.textSecondary} strokeWidth={2} style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="never"
        />
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
  input: {
    flex: 1,
    fontSize: 16.5, // Increased by 10%
    fontFamily: 'Inter-Regular',
    color: theme.colors.text,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 6,
  },
});