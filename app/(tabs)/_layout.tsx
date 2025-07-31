import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { View, StyleSheet, Platform } from 'react-native';
import { useEffect } from 'react';
import { router } from 'expo-router';
// Remove CollapsibleMenu import
// import CollapsibleMenu from '@/components/CollapsibleMenu';

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

  return (
    <View style={styles.container}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="index"
          options={{
            title: 'Search',
          }}
        />
        <Stack.Screen
          name="saved"
          options={{
            title: 'Saved',
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            title: 'Settings',
          }}
        />
      </Stack>
      
      {/* Remove Collapsible Menu */}
      {/* <CollapsibleMenu /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});