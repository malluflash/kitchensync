import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { FridgeProvider } from './src/context/FridgeContext';
import { PremiumProvider } from './src/context/PremiumContext';
import { SettingsProvider } from './src/context/SettingsContext';
import RootNavigator from './src/navigation';
import { requestNotificationPermissions } from './src/utils/notifications';
import { colors } from './src/theme';

const MyFridgeTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.card,
    text: colors.white,
    border: colors.cardBorder,
    notification: colors.primary,
  },
};

export default function App() {
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <PremiumProvider>
          <FridgeProvider>
            <NavigationContainer theme={MyFridgeTheme}>
              <StatusBar style="light" backgroundColor={colors.background} />
              <RootNavigator />
            </NavigationContainer>
          </FridgeProvider>
        </PremiumProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
