// App entry point — detects first launch, handles notification taps, manages splash screen
import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getNotificationsModule, isNotificationsSupported } from './src/services/notificationsModule';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import BrandedSplashScreen from './src/components/BrandedSplashScreen';
import { Colors } from './src/constants/Colors';
import { getOnboardingDone } from './src/services/storage';
import { initAnalytics, track } from './src/services/analytics';
import { AnalyticsEvents } from './src/constants/AnalyticsEvents';
import { RootStackParamList } from './src/types';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      try {
        await initAnalytics();
        void track(AnalyticsEvents.APP_OPENED);
        const done = await getOnboardingDone();
        setInitialRoute(done ? 'Home' : 'Onboarding');
      } finally {
        setAppReady(true);
      }
    }
    bootstrap();

    if (!isNotificationsSupported()) return;

    const Notifications = getNotificationsModule();
    if (!Notifications) return;

    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as { type?: string };
      if (data?.type === 'fajr_alarm') {
        void track(AnalyticsEvents.NOTIFICATION_OPENED, { source: 'fajr_alarm' });
        setInitialRoute('AlarmRinging');
      }
    });

    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (appReady && initialRoute) {
      void SplashScreen.hideAsync();
    }
  }, [appReady, initialRoute]);

  if (!appReady || !initialRoute) {
    return (
      <>
        <StatusBar style="light" />
        <BrandedSplashScreen />
      </>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.darkBg }}>
      <SafeAreaProvider style={{ flex: 1, backgroundColor: Colors.darkBg }}>
        <StatusBar style="light" />
        <AppNavigator initialRoute={initialRoute} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
