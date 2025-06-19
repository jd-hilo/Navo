import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SubscriptionContextType {
  isPremium: boolean;
  setIsPremium: (isPremium: boolean) => void;
  upgradeToPremium: () => void;
  downgradeToFree: () => void;
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
  const [isPremium, setIsPremiumState] = useState(false);

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  const loadSubscriptionStatus = async () => {
    try {
      const status = await AsyncStorage.getItem('subscription_status');
      if (status === 'premium') {
        setIsPremiumState(true);
      }
    } catch (error) {
      console.error('Error loading subscription status:', error);
    }
  };

  const setIsPremium = async (premium: boolean) => {
    try {
      setIsPremiumState(premium);
      await AsyncStorage.setItem('subscription_status', premium ? 'premium' : 'free');
    } catch (error) {
      console.error('Error saving subscription status:', error);
    }
  };

  const upgradeToPremium = () => {
    setIsPremium(true);
  };

  const downgradeToFree = () => {
    setIsPremium(false);
  };

  const value = {
    isPremium,
    setIsPremium,
    upgradeToPremium,
    downgradeToFree,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}; 