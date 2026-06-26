// Root stack navigator — no visible header (each screen has its own)
import React, { useRef } from 'react';
import { Platform } from 'react-native';
import { DarkTheme, NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { Colors } from '../constants/Colors';
import { RootStackParamList } from '../types';
import { trackScreen } from '../services/analytics';
import OnboardingScreen   from '../screens/OnboardingScreen';
import HomeScreen         from '../screens/HomeScreen';
import AlarmSettingsScreen from '../screens/AlarmSettingsScreen';
import AlarmRingingScreen  from '../screens/AlarmRingingScreen';
import PrayerMatScanScreen from '../screens/PrayerMatScanScreen';
import ConfirmationScreen  from '../screens/ConfirmationScreen';

const Stack = createStackNavigator<RootStackParamList>();

const NavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.accent,
    background: Colors.darkBg,
    card: Colors.darkBg,
    border: '#3D2030',
    text: Colors.white,
  },
};

interface Props {
  initialRoute: keyof RootStackParamList;
}

export default function AppNavigator({ initialRoute }: Props) {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const routeNameRef = useRef<string | undefined>(initialRoute);

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={NavTheme}
      onReady={() => {
        routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
        if (routeNameRef.current) void trackScreen(routeNameRef.current);
      }}
      onStateChange={() => {
        const current = navigationRef.current?.getCurrentRoute()?.name;
        if (current && current !== routeNameRef.current) {
          routeNameRef.current = current;
          void trackScreen(current);
        }
      }}
    >
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: Colors.darkBg },
          cardOverlayEnabled: false,
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          ...(Platform.OS === 'android' ? { animationEnabled: true } : {}),
        }}
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
