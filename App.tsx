// App entry point — detects first launch, handles notification taps, manages splash screen
import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { getOnboardingDone } from './src/services/storage';
import { Colors } from './src/constants/Colors';
import { RootStackParamList } from './src/types';

// Keep the splash visible while we load
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    async function bootstrap() {
      try {
        const done = await getOnboardingDone();
        setInitialRoute(done ? 'Home' : 'Onboarding');
      } finally {
        // Hide splash once we know where to go
        await SplashScreen.hideAsync();
      }
    }
    bootstrap();

    // Handle notification tap — navigate to AlarmRinging
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as { type?: string };
      if (data?.type === 'fajr_alarm') {
        setInitialRoute('AlarmRinging');
      }
    });

    return () => sub.remove();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AppNavigator initialRoute={initialRoute} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
