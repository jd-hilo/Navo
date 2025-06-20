import React, { createContext, useContext, useState, useEffect } from 'react';
import Purchases, { PurchasesOffering, CustomerInfo } from 'react-native-purchases';
import { useAuth } from './AuthContext';
import { AppState } from 'react-native';

interface SubscriptionContextType {
  isPremium: boolean;
  upgradeToPremium: () => Promise<void>;
  offerings: PurchasesOffering | null;
  customerInfo: CustomerInfo | null;
  isLoading: boolean;
  restorePurchases: () => Promise<void>;
  refreshSubscriptionStatus: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: React.ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSubscriptionStatus();
    loadOfferings();
  }, []);

  useEffect(() => {
    if (user?.id) {
      // Set user ID in RevenueCat when user logs in
      Purchases.logIn(user.id);
      // Reload subscription status after login
      loadSubscriptionStatus();
    }
  }, [user]);

  // Add app state listener to refresh subscription status when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = () => {
      loadSubscriptionStatus();
    };

    // Listen for app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, []);

  const loadSubscriptionStatus = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      setCustomerInfo(customerInfo);
      
      console.log('=== SUBSCRIPTION STATUS DEBUG ===');
      console.log('Customer info loaded:', customerInfo);
      console.log('Active entitlements:', customerInfo.entitlements.active);
      console.log('All entitlements:', customerInfo.entitlements);
      console.log('Active subscriptions:', customerInfo.activeSubscriptions);
      console.log('All purchased product IDs:', customerInfo.allPurchasedProductIdentifiers);
      
      // Check for premium entitlement (you might need to adjust this name)
      const hasPremium = customerInfo.entitlements.active['Pro'] !== undefined;
      console.log('Looking for entitlement: Pro');
      console.log('Premium entitlement found:', hasPremium);
      console.log('Premium entitlement details:', customerInfo.entitlements.active['Pro']);
      
      // Show all available entitlements
      console.log('All entitlement names:', Object.keys(customerInfo.entitlements.all));
      console.log('All active entitlement names:', Object.keys(customerInfo.entitlements.active));
      
      // Check if there are any active entitlements with different names
      Object.entries(customerInfo.entitlements.active).forEach(([name, entitlement]) => {
        console.log(`Active entitlement "${name}":`, entitlement);
      });
      
      // More robust check: if user has any active entitlements, they're premium
      const hasAnyActiveEntitlement = Object.keys(customerInfo.entitlements.active).length > 0;
      console.log('Has any active entitlement:', hasAnyActiveEntitlement);
      
      // Use the more robust check
      const finalPremiumStatus = hasAnyActiveEntitlement;
      setIsPremium(finalPremiumStatus);
      console.log('Final isPremium state:', finalPremiumStatus);
      console.log('=== END DEBUG ===');
    } catch (error) {
      console.error('Error loading subscription status:', error);
    }
  };

  const loadOfferings = async () => {
    try {
      console.log('Loading offerings...');
      const offerings = await Purchases.getOfferings();
      console.log('All offerings:', offerings);
      console.log('Current offering:', offerings.current);
      console.log('Available offerings:', Object.keys(offerings.all));
      
      // Log details of each offering
      Object.entries(offerings.all).forEach(([key, offering]) => {
        console.log(`Offering ${key}:`, offering);
        console.log(`  - Available packages:`, offering.availablePackages);
        console.log(`  - Package count:`, offering.availablePackages.length);
      });
      
      if (offerings.current) {
        console.log('Current offering packages:', offerings.current.availablePackages);
        setOfferings(offerings.current);
      } else {
        console.log('No current offering found, trying to use default...');
        // Try to get the default offering if current is null
        const defaultOffering = offerings.all['default'];
        if (defaultOffering) {
          console.log('Using default offering:', defaultOffering);
          setOfferings(defaultOffering);
        } else {
          console.log('No default offering found either');
          setOfferings(null);
        }
      }
    } catch (error) {
      console.error('Error loading offerings:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    }
  };

  const upgradeToPremium = async () => {
    if (!offerings?.availablePackages.length) {
      console.error('No packages available');
      return;
    }

    setIsLoading(true);
    try {
      // Purchase the first available package (usually monthly)
      const packageToPurchase = offerings.availablePackages[0];
      console.log('Purchasing package:', packageToPurchase);
      
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      
      setCustomerInfo(customerInfo);
      const hasPremium = Object.keys(customerInfo.entitlements.active).length > 0;
      setIsPremium(hasPremium);
      
      console.log('Purchase completed:', { hasPremium, entitlements: customerInfo.entitlements });
    } catch (error: any) {
      console.error('Purchase error:', error);
      if (!error.userCancelled) {
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const restorePurchases = async () => {
    setIsLoading(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      setCustomerInfo(customerInfo);
      const hasPremium = Object.keys(customerInfo.entitlements.active).length > 0;
      setIsPremium(hasPremium);
      
      console.log('Purchases restored:', { hasPremium, entitlements: customerInfo.entitlements });
    } catch (error) {
      console.error('Restore error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSubscriptionStatus = async () => {
    try {
      await loadSubscriptionStatus();
      await loadOfferings();
    } catch (error) {
      console.error('Error refreshing subscription status:', error);
    }
  };

  const value = {
    isPremium,
    upgradeToPremium,
    offerings,
    customerInfo,
    isLoading,
    restorePurchases,
    refreshSubscriptionStatus,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}; 