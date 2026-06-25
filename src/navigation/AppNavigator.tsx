// Root stack navigator — no visible header (each screen has its own)
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import OnboardingScreen   from '../screens/OnboardingScreen';
import HomeScreen         from '../screens/HomeScreen';
import AlarmSettingsScreen from '../screens/AlarmSettingsScreen';
import AlarmRingingScreen  from '../screens/AlarmRingingScreen';
import PrayerMatScanScreen from '../screens/PrayerMatScanScreen';
import ConfirmationScreen  from '../screens/ConfirmationScreen';

const Stack = createStackNavigator<RootStackParamList>();

interface Props {
  initialRoute: keyof RootStackParamList;
}

export default function AppNavigator({ initialRoute }: Props) {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false, cardStyle: { backgroundColor: '#FDF7F5' } }}
      >
        <Stack.Screen name="Onboarding"    component={OnboardingScreen} />
        <Stack.Screen name="Home"          component={HomeScreen} />
        <Stack.Screen name="AlarmSettings" component={AlarmSettingsScreen} />
        <Stack.Screen name="AlarmRinging"  component={AlarmRingingScreen} />
        <Stack.Screen name="PrayerMatScan" component={PrayerMatScanScreen} />
        <Stack.Screen name="Confirmation"  component={ConfirmationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
