// Lazy-load expo-notifications — importing it in Expo Go on Android throws (SDK 53+).
import Constants from 'expo-constants';

type NotificationsModule = typeof import('expo-notifications');

let cached: NotificationsModule | null | undefined;

/** Local alarms need a development build; Expo Go on Android is unsupported. */
export function isNotificationsSupported(): boolean {
  return Constants.appOwnership !== 'expo';
}

export function getNotificationsModule(): NotificationsModule | null {
  if (!isNotificationsSupported()) return null;
  if (cached !== undefined) return cached;

  try {
    cached = require('expo-notifications') as NotificationsModule;
  } catch {
    cached = null;
  }
  return cached;
}

export function initNotificationsModule(): void {
  const Notifications = getNotificationsModule();
  if (!Notifications) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}
