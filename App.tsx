// App entry point — detects first launch, handles notification taps, manages splash screen
import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import BrandedSplashScreen from './src/components/BrandedSplashScreen';
import { getOnboardingDone } from './src/services/storage';
import { RootStackParamList } from './src/types';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      try {
        const done = await getOnboardingDone();
        setInitialRoute(done ? 'Home' : 'Onboarding');
      } finally {
        setAppReady(true);
      }
    }
    bootstrap();

    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as { type?: string };
      if (data?.type === 'fajr_alarm') {
        setInitialRoute('AlarmRinging');
      }
    });

    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (appReady) {
      SplashScreen.hideAsync();
    }
  }, [appReady]);

  if (!appReady || !initialRoute) {
    return <BrandedSplashScreen />;
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
