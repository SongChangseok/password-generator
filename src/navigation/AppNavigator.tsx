import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '@/types';
import GeneratorScreen from '@/screens/GeneratorScreen';
import PasswordListScreen from '@/screens/PasswordListScreen';
import SettingsScreen from '@/screens/SettingsScreen';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Generator"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1E3A8A',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Generator"
          component={GeneratorScreen}
          options={{ title: 'Password Generator' }}
        />
        <Stack.Screen
          name="PasswordList"
          component={PasswordListScreen}
          options={{ title: 'Saved Passwords' }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;