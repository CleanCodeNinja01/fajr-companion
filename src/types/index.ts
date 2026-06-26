// Shared TypeScript types for Fajr Companion

export type WakeOffset = 0 | 15 | 30 | 45;

export type SoundType = 'adhan' | 'gentle';

export type CalculationMethodKey =
  | 'MuslimWorldLeague'
  | 'NorthAmerica'
  | 'Egyptian'
  | 'Karachi'
  | 'UmmAlQura'
  | 'Tehran'
  | 'Turkey';

export interface AlarmSettings {
  enabled: boolean;
  offset: WakeOffset;
  snoozeEnabled: boolean;
  maxSnoozes: number;
  soundType: SoundType;
  calculationMethod: CalculationMethodKey;
}

export interface StreakData {
  count: number;
  lastConfirmedDate: string | null; // 'YYYY-MM-DD'
}

export interface LocationData {
  latitude: number;
  longitude: number;
  cityName?: string;
  country?: string;
  timezone?: string;
}

export interface CitySuggestion {
  displayName: string;
  cityName: string;
  latitude: number;
  longitude: number;
  country?: string;
}

export type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  AlarmSettings: undefined;
  AlarmRinging: undefined;
  PrayerMatScan: undefined;
  Confirmation: undefined;
};
