import { Tabs } from 'expo-router';
import { Search, Bookmark, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { View, StyleSheet, Platform, TouchableOpacity, GestureResponderEvent } from 'react-native';
import { BlurView } from 'expo-blur';
import { useEffect } from 'react';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('🚪 User not authenticated in tabs, redirecting to welcome');
      router.replace('/(auth)/welcome');
    }
  }, [isAuthenticated, isLoading]);

  // Show loading or don't render tabs if not authenticated
  if (isLoading || !isAuthenticated) {
    return null;
  }

  const handleTabPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const TabIcon = ({ icon: Icon, focused, color }: { icon: any; focused: boolean; color: string }) => (
    <View style={[
      styles.iconContainer,
      focused && styles.iconContainerFocused,
      { backgroundColor: focused ? (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)') : 'transparent' }
    ]}>
      <Icon 
        size={20} 
        color={focused ? theme.colors.text : theme.colors.textSecondary} 
        strokeWidth={focused ? 2.5 : 2}
      />
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 16 + Math.max(insets.bottom, 0),
          left: '50%',
          marginLeft: 50, // Half of the width (300/2) - using negative for proper centering
          width: 300,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 48,
          borderRadius: 50,
          overflow: 'hidden',
        },
        tabBarBackground: () => (
          <BlurView 
            style={styles.tabBarBackground}
            intensity={80}
            tint={isDark ? 'dark' : 'light'}
          />
        ),
        tabBarActiveTintColor: theme.colors.text,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarShowLabel: false,
        tabBarItemStyle: {
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarButton: (props: any) => (
          <TouchableOpacity
            {...props}
            onPress={(e: GestureResponderEvent) => {
              handleTabPress();
              props.onPress?.(e);
            }}
          />
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon={Search} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon={Bookmark} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon={Settings} focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 50,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerFocused: {
    transform: [{ scale: 1.1 }],
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});