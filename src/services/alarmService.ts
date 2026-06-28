// Schedule and cancel Expo local notifications for the Fajr alarm
import { Platform } from 'react-native';
import {
  getNotificationsModule,
  initNotificationsModule,
  isNotificationsSupported,
} from './notificationsModule';

const FAJR_CHANNEL_ID = 'fajr-alarm';

let channelReady = false;
let handlerReady = false;

function notifications() {
  if (!handlerReady) {
    initNotificationsModule();
    handlerReady = true;
  }
  return getNotificationsModule();
}

async function ensureAndroidChannel(): Promise<void> {
  const Notifications = notifications();
  if (!Notifications || Platform.OS !== 'android' || channelReady) return;
  await Notifications.setNotificationChannelAsync(FAJR_CHANNEL_ID, {
    name: 'Fajr Alarm',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    sound: 'default',
    bypassDnd: true,
  });
  channelReady = true;
}

export async function getNotificationPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  const Notifications = notifications();
  if (!Notifications) return 'undetermined';
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

export async function requestNotificationPermission(): Promise<boolean> {
  const Notifications = notifications();
  if (!Notifications) return false;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Schedule alarm at (fajrTime - offsetMinutes).
 * Returns the notification identifier string.
 */
export async function scheduleAlarm(
  fajrTime: Date,
  offsetMinutes: number,
): Promise<string> {
  const Notifications = notifications();
  if (!Notifications) {
    throw new Error('Notifications require a development build (not Expo Go on Android).');
  }

  await ensureAndroidChannel();
  const triggerDate = new Date(fajrTime.getTime() - offsetMinutes * 60 * 1000);

  if (triggerDate <= new Date()) {
    triggerDate.setDate(triggerDate.getDate() + 1);
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🕌 Fajr Time',
      body: "It's time to wake up for Fajr prayer.",
      sound: true,
      data: { type: 'fajr_alarm' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      channelId: FAJR_CHANNEL_ID,
    },
  });

  return id;
}

export async function cancelAlarm(id: string): Promise<void> {
  const Notifications = notifications();
  if (!Notifications) return;
  await Notifications.cancelScheduledNotificationAsync(id);
}

export async function cancelAllAlarms(): Promise<void> {
  const Notifications = notifications();
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** Schedule a snooze notification N minutes from now. */
export async function scheduleSnooze(minutes: number = 5): Promise<string> {
  const Notifications = notifications();
  if (!Notifications) {
    throw new Error('Notifications require a development build (not Expo Go on Android).');
  }

  await ensureAndroidChannel();
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🕌 Fajr — Snooze Over',
      body: 'Wake up! Fajr prayer is waiting.',
      sound: true,
      data: { type: 'fajr_alarm' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: minutes * 60,
      channelId: FAJR_CHANNEL_ID,
    },
  });
  return id;
}

export { isNotificationsSupported };
