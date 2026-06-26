// Reschedule the OS Fajr notification from location + alarm settings
import { AlarmSettings, LocationData, WakeOffset } from '../types';
import { cancelAllAlarms, scheduleAlarm } from './alarmService';
import { saveNotificationId } from './storage';
import { getFajrTime, getLocalCalendarDate, resolveFajrDisplay } from './prayerTimes';

export function computeNextFajr(
  location: LocationData,
  calculationMethod: AlarmSettings['calculationMethod'],
): Date | null {
  const tz = location.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const todayFajr = getFajrTime(
    location.latitude,
    location.longitude,
    calculationMethod,
    getLocalCalendarDate(tz),
    location.country,
  );
  const tomorrowFajr = getFajrTime(
    location.latitude,
    location.longitude,
    calculationMethod,
    getLocalCalendarDate(tz, 1),
    location.country,
  );
  return resolveFajrDisplay(todayFajr, tomorrowFajr).primary;
}

export async function rescheduleFajrAlarm(
  fajrTime: Date,
  offset: WakeOffset,
): Promise<void> {
  await cancelAllAlarms();
  const id = await scheduleAlarm(fajrTime, offset);
  await saveNotificationId(id);
}

export async function rescheduleFajrAlarmIfEnabled(
  settings: AlarmSettings,
  location: LocationData | null,
): Promise<void> {
  if (!settings.enabled || !location) return;
  const nextFajr = computeNextFajr(location, settings.calculationMethod);
  if (!nextFajr) return;
  await rescheduleFajrAlarm(nextFajr, settings.offset);
}
