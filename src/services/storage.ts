// All AsyncStorage helpers — typed get/set for every persisted key
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AlarmSettings, StreakData, LocationData } from '../types';
import { DEFAULT_ALARM_SETTINGS, DEFAULT_STREAK } from '../constants/Defaults';

const KEYS = {
  ONBOARDING_DONE:  'onboarding_done',
  ALARM_SETTINGS:   'alarm_settings',
  STREAK_DATA:      'streak_data',
  LOCATION_DATA:    'location_data',
  NOTIFICATION_ID:  'notification_id',
  CHECKLIST:        'checklist_state',
  SNOOZE_COUNT:     'snooze_count',
} as const;

// --- Onboarding ---
export async function getOnboardingDone(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.ONBOARDING_DONE);
  return val === 'true';
}
export async function setOnboardingDone(): Promise<void> {
  await AsyncStorage.setItem(KEYS.ONBOARDING_DONE, 'true');
}

// --- Alarm Settings ---
export async function getAlarmSettings(): Promise<AlarmSettings> {
  const raw = await AsyncStorage.getItem(KEYS.ALARM_SETTINGS);
  if (!raw) return DEFAULT_ALARM_SETTINGS;
  return { ...DEFAULT_ALARM_SETTINGS, ...JSON.parse(raw) };
}
export async function saveAlarmSettings(settings: AlarmSettings): Promise<void> {
  await AsyncStorage.setItem(KEYS.ALARM_SETTINGS, JSON.stringify(settings));
}

// --- Streak ---
export async function getStreak(): Promise<StreakData> {
  const raw = await AsyncStorage.getItem(KEYS.STREAK_DATA);
  if (!raw) return DEFAULT_STREAK;
  return JSON.parse(raw);
}
export async function saveStreak(data: StreakData): Promise<void> {
  await AsyncStorage.setItem(KEYS.STREAK_DATA, JSON.stringify(data));
}

// --- Location ---
export async function getLocation(): Promise<LocationData | null> {
  const raw = await AsyncStorage.getItem(KEYS.LOCATION_DATA);
  if (!raw) return null;
  return JSON.parse(raw);
}
export async function saveLocation(data: LocationData): Promise<void> {
  await AsyncStorage.setItem(KEYS.LOCATION_DATA, JSON.stringify(data));
}

// --- Notification ID ---
export async function getNotificationId(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.NOTIFICATION_ID);
}
export async function saveNotificationId(id: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.NOTIFICATION_ID, id);
}
export async function clearNotificationId(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.NOTIFICATION_ID);
}

// --- Checklist (keyed by date string YYYY-MM-DD) ---
export async function getChecklist(date: string): Promise<Record<string, boolean>> {
  const raw = await AsyncStorage.getItem(`${KEYS.CHECKLIST}_${date}`);
  if (!raw) return {};
  return JSON.parse(raw);
}
export async function saveChecklist(date: string, state: Record<string, boolean>): Promise<void> {
  await AsyncStorage.setItem(`${KEYS.CHECKLIST}_${date}`, JSON.stringify(state));
}

// --- Snooze count for current alarm cycle ---
export async function getSnoozeCount(): Promise<number> {
  const val = await AsyncStorage.getItem(KEYS.SNOOZE_COUNT);
  return val ? parseInt(val, 10) : 0;
}
export async function setSnoozeCount(count: number): Promise<void> {
  await AsyncStorage.setItem(KEYS.SNOOZE_COUNT, String(count));
}
export async function resetSnoozeCount(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.SNOOZE_COUNT);
}

// --- Full reset (dev / "Start Over") ---
export async function resetAllData(): Promise<void> {
  const allKeys = await AsyncStorage.getAllKeys();
  const checklistPrefix = `${KEYS.CHECKLIST}_`;
  const toRemove = allKeys.filter(
    k => (Object.values(KEYS) as string[]).includes(k) || k.startsWith(checklistPrefix),
  );
  if (toRemove.length > 0) {
    await AsyncStorage.multiRemove(toRemove);
  }
}
