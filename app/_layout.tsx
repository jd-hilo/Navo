import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import Purchases from 'react-native-purchases';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import adjustService from '@/adjustService';
import { Loading } from '@/components/loading';

// Prevent the splash screen from auto-hiding
//SplashScreen.preventAutoHideAsync();

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await requestTrackingPermissionsAsync();
      if (status === 'granted') {
        console.log('Yay! I have user permission to track data');
        adjustService.initialize();
        console.log('adjust service has been initialized');
      }
    })();
    const initializeRevenueCat = async () => {
      try {
        const apiKey =
          process.env.REVENUECAT_API_KEY || 'appl_pLYSxabOrylcJikneEUYdElyDUm';

        // Configure RevenueCat with StoreKit configuration for testing
        await Purchases.configure({
          apiKey: apiKey,
          appUserID: null, // Let RevenueCat generate a user ID
          useAmazon: false,
          shouldShowInAppMessagesAutomatically: true,
        });

        // Force use of StoreKit configuration for testing
        if (__DEV__) {
          console.log('Development mode: Using StoreKit configuration');
          // Enable StoreKit testing mode
          try {
            await Purchases.setSimulatesAskToBuyInSandbox(true);
            console.log('StoreKit testing mode enabled');
          } catch (error) {
            console.log('StoreKit testing mode setup error:', error);
          }
        }

        console.log('RevenueCat initialized successfully');

        // Test fetching offerings immediately
        try {
          const offerings = await Purchases.getOfferings();
          console.log('Initial offerings fetch:', offerings);
        } catch (offeringsError) {
          console.error('Initial offerings fetch failed:', offeringsError);
        }
      } catch (error) {
        console.error('Failed to initialize RevenueCat:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeRevenueCat();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      setTimeout(() => {
        // SplashScreen.hideAsync();
      }, 1000);
    }
  }, [fontsLoaded, fontError]);

  // Don't render anything until fonts are loaded and initialization is complete
  if (!fontsLoaded && !fontError && !isInitialized) {
    return (
      <ThemeProvider>
        <Loading />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <QueryClientProvider client={queryClient}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
          </QueryClientProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
