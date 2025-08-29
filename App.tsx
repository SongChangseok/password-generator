import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';

import GeneratorScreen from './src/screens/GeneratorScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import PinSetupScreen from './src/screens/PinSetupScreen';
import AuthScreen from './src/screens/AuthScreen';
import { AppLockProvider, useAppLock } from './src/contexts/AppLockContext';
import { BackgroundProtection } from './src/components/BackgroundProtection';
import { adManager } from './src/utils/adManager';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Generator"
        component={GeneratorScreen}
        options={{ title: 'Generate' }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ title: 'History' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isLocked, isLoading, authenticate, settings } = useAppLock();

  useEffect(() => {
    // Initialize ads and track app launch
    const handleAppLaunch = async () => {
      if (Platform.OS !== 'web') {
        await adManager.incrementAppLaunchCount();

        // Show interstitial ad after authentication (if applicable)
        setTimeout(async () => {
          await adManager.showInterstitialAd();
        }, 2000); // 2 second delay to not interrupt user flow
      }
    };

    handleAppLaunch();
  }, []);

  if (isLoading) {
    return null; // Could add a loading screen here
  }

  if (isLocked) {
    return <AuthScreen onAuthenticated={authenticate} />;
  }

  return (
    <BackgroundProtection enabled={settings?.backgroundProtection || false}>
      <Stack.Navigator>
        <Stack.Screen
          name="Main"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PinSetup"
          component={PinSetupScreen}
          options={{
            title: 'PIN Setup',
            presentation: 'modal',
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </BackgroundProtection>
  );
}

export default function App() {
  return (
    <AppLockProvider>
      <NavigationContainer>
        <AppNavigator />
        <StatusBar style="auto" />
      </NavigationContainer>
    </AppLockProvider>
  );
}
