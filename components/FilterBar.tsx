import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

export type FilterType = 'all' | 'ai' | 'tiktok' | 'reddit' | 'pinterest';

interface FilterBarProps {
  onFilterChange: (filter: FilterType) => void;
  currentFilter: FilterType;
  visible: boolean;
}

const FilterBar = ({ onFilterChange, currentFilter, visible }: FilterBarProps) => {
  const { theme } = useTheme();

  if (!visible) return null;

  const styles = createStyles(theme);

  const filters = [
    { id: 'all' as FilterType, label: 'All', icon: null },
    { id: 'ai' as FilterType, label: 'AI generated', icon: require('@/assets/images/blue.png') },
    { id: 'tiktok' as FilterType, label: 'TikTok', icon: require('@/assets/images/tiktok.png') },
    { id: 'reddit' as FilterType, label: 'Reddit', icon: require('@/assets/images/Reddit_Logo.png') },
    { id: 'pinterest' as FilterType, label: 'Pinterest', icon: require('@/assets/images/pinterest.png') },
  ];

  const renderFilterButton = (filter: { id: FilterType; label: string; icon: any }) => {
    const isSelected = currentFilter === filter.id;
    
    return (
      <TouchableOpacity
        key={filter.id}
        style={styles.filterButton}
        onPress={() => onFilterChange(filter.id)}
        activeOpacity={0.7}
      >
        <View style={styles.filterButtonGradient}>
          {isSelected ? (
            <LinearGradient
              colors={['#AE6DC3', '#CC72A1', '#E38B81']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBackground}
            />
          ) : null}
          <View style={styles.filterButtonContent}>
            <Text style={[
              styles.filterButtonText,
              isSelected ? styles.filterButtonTextSelected : styles.filterButtonTextUnselected
            ]}>
              {filter.label}
            </Text>
            {filter.icon && (
              <Image source={filter.icon} style={styles.filterIcon} resizeMode="contain" />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterBar}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.scrollView}
          contentInsetAdjustmentBehavior="automatic"
        >
          {filters.map(renderFilterButton)}
        </ScrollView>
      </View>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: 65,
    left: 0,
    bottom: 90, // Move up 10px from 80
    zIndex: 1000,
  },
  filterBar: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 8,
    paddingHorizontal: 20,
    gap: 10,
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  filterRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 2,
    height: 40,
    paddingLeft: 20,
    justifyContent: 'flex-start',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 2,
    height: 40,
    flex: 0,
  },
  filterButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 12,
    gap: 4,
    borderRadius: 46,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: theme.colors.searchBar,
    position: 'relative',
    minHeight: 36,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 46,
  },
  filterButtonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    gap: 4,
  },
  filterButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    textAlign: 'center',
    color: '#FFFFFF',
  },
  filterButtonTextSelected: {
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
  },
  filterButtonTextUnselected: {
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
  },
  filterIcon: {
    width: 14,
    height: 14,
  },

});

export default FilterBar; 