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
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';

export type FilterType = 'all' | 'ai' | 'tiktok' | 'reddit' | 'pinterest';

interface FilterBarProps {
  onFilterChange: (filter: FilterType) => void;
  currentFilter: FilterType;
  visible: boolean;
}

const FilterBar = ({ onFilterChange, currentFilter, visible }: FilterBarProps) => {
  const { theme, isDark } = useTheme();

  if (!visible) return null;

  const styles = createStyles(theme, isDark);

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
        {isSelected ? (
          <View style={styles.filterButtonGradient}>
            <LinearGradient
              colors={['#00282A', '#006367']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientBackground}
            />
            <View style={styles.filterButtonContent}>
              <Text style={[
                styles.filterButtonText,
                styles.filterButtonTextSelected
              ]}>
                {filter.label}
              </Text>
              {filter.icon && (
                <Image source={filter.icon} style={styles.filterIcon} resizeMode="contain" />
              )}
            </View>
          </View>
        ) : (
          isDark ? (
            <BlurView intensity={25} style={styles.filterButtonGradient}>
              <LinearGradient
                colors={['rgba(0, 40, 42, 0.08)', 'rgba(0, 99, 103, 0.08)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.gradientBackground}
              />
              <View style={styles.filterButtonContent}>
                <Text style={[
                  styles.filterButtonText,
                  styles.filterButtonTextUnselected
                ]}>
                  {filter.label}
                </Text>
                {filter.icon && (
                  <Image source={filter.icon} style={styles.filterIcon} resizeMode="contain" />
                )}
              </View>
            </BlurView>
          ) : (
            <View style={[styles.filterButtonGradient, styles.filterButtonLightChip]}>
              <View style={styles.filterButtonContent}>
                <Text style={[
                  styles.filterButtonText,
                  styles.filterButtonTextUnselected
                ]}>
                  {filter.label}
                </Text>
                {filter.icon && (
                  <Image source={filter.icon} style={styles.filterIcon} resizeMode="contain" />
                )}
              </View>
            </View>
          )
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {isDark ? (
        <BlurView intensity={25} style={styles.filterBar}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
            style={styles.scrollView}
            contentInsetAdjustmentBehavior="automatic"
          >
            {filters.map(renderFilterButton)}
          </ScrollView>
        </BlurView>
      ) : (
        <View style={[styles.filterBar, { backgroundColor: 'transparent' }] }>
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
      )}
    </View>
  );
};

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: 60,
    left: 0,
    top: 70,
    zIndex: 1000,
  },
  filterBar: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 8,
    gap: 10,
    width: '100%',
    height: '100%',
    borderRadius: 29,
    position: 'relative',
    overflow: 'hidden',
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 4,
    position: 'relative',
    minHeight: 38,
    overflow: 'hidden',
  },
  filterButtonLightChip: {
    backgroundColor: theme.colors.searchBar,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowOpacity: 0,
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
    color: isDark ? '#FFFFFF' : '#000000',
  },
  filterButtonTextSelected: {
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 19,
    color: '#FFFFFF',
  },
  filterButtonTextUnselected: {
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 18,
  },
  filterIcon: {
    width: 14,
    height: 14,
  },

});

export default FilterBar; 