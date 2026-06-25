// Schedule and cancel Expo local notifications for the Fajr alarm
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function getNotificationPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

export async function requestNotificationPermission(): Promise<boolean> {
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
  const triggerDate = new Date(fajrTime.getTime() - offsetMinutes * 60 * 1000);

  // If trigger time is in the past, schedule for tomorrow
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
    },
  });

  return id;
}

export async function cancelAlarm(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}

export async function cancelAllAlarms(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Schedule a snooze notification N minutes from now.
 */
export async function scheduleSnooze(minutes: number = 5): Promise<string> {
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
    },
  });
  return id;
}
