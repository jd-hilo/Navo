import React, { createContext, useContext, useState, useEffect } from 'react';
import Purchases, { PurchasesOffering, CustomerInfo } from 'react-native-purchases';
import { useAuth } from './AuthContext';

interface SubscriptionContextType {
  isPremium: boolean;
  upgradeToPremium: () => Promise<void>;
  offerings: PurchasesOffering | null;
  customerInfo: CustomerInfo | null;
  isLoading: boolean;
  restorePurchases: () => Promise<void>;
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
    }
  }, [user]);

  const loadSubscriptionStatus = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      setCustomerInfo(customerInfo);
      
      const hasPremium = customerInfo.entitlements.active['premium'] !== undefined;
      setIsPremium(hasPremium);
      console.log('Subscription status loaded:', { hasPremium, entitlements: customerInfo.entitlements });
    } catch (error) {
      console.error('Error loading subscription status:', error);
    }
  };

  const loadOfferings = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      setOfferings(offerings.current);
      console.log('Offerings loaded:', offerings.current);
    } catch (error) {
      console.error('Error loading offerings:', error);
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
      const hasPremium = customerInfo.entitlements.active['premium'] !== undefined;
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
      const hasPremium = customerInfo.entitlements.active['premium'] !== undefined;
      setIsPremium(hasPremium);
      
      console.log('Purchases restored:', { hasPremium, entitlements: customerInfo.entitlements });
    } catch (error) {
      console.error('Restore error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    isPremium,
    upgradeToPremium,
    offerings,
    customerInfo,
    isLoading,
    restorePurchases,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}; 