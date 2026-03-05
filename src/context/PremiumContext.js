import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREMIUM_KEY = '@myfridge_premium';
export const FREE_ITEM_LIMIT = 20;

const PremiumContext = createContext(null);

export function PremiumProvider({ children }) {
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(PREMIUM_KEY).then(val => {
      if (val === 'true') setIsPremium(true);
    });
  }, []);

  const upgradeToPremium = async () => {
    setIsPremium(true);
    await AsyncStorage.setItem(PREMIUM_KEY, 'true');
  };

  const cancelPremium = async () => {
    setIsPremium(false);
    await AsyncStorage.setItem(PREMIUM_KEY, 'false');
  };

  return (
    <PremiumContext.Provider value={{ isPremium, upgradeToPremium, cancelPremium }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error('usePremium must be used within PremiumProvider');
  return ctx;
}
