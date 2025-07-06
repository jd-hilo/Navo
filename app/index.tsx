import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/loading';

export default function IndexScreen() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      // Add a small delay to ensure proper navigation
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          console.log('🏠 User authenticated, navigating to tabs');
          router.replace('/(tabs)');
        } else {
          console.log('🚪 User not authenticated, navigating to welcome');
          router.replace('/(auth)/welcome');
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading]);

  // Show loading indicator while auth is initializing
  if (isLoading) {
    return <Loading />;
  }

  // This should never be reached, but just in case
  return <Loading />;
}
