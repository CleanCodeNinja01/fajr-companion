import { AlarmSettings, StreakData, CalculationMethodKey } from '../types';

export const DEFAULT_ALARM_SETTINGS: AlarmSettings = {
  enabled: false,
  offset: 0,
  snoozeEnabled: true,
  maxSnoozes: 3,
  soundType: 'adhan',
  calculationMethod: 'NorthAmerica',
};

export const DEFAULT_STREAK: StreakData = {
  count: 0,
  lastConfirmedDate: null,
};

export const CALCULATION_METHODS: { key: CalculationMethodKey; label: string }[] = [
  { key: 'NorthAmerica',       label: 'ISNA (North America)' },
  { key: 'MuslimWorldLeague',  label: 'Muslim World League' },
  { key: 'Egyptian',           label: 'Egyptian General Authority' },
  { key: 'Karachi',            label: 'University of Islamic Sciences, Karachi' },
  { key: 'UmmAlQura',          label: 'Umm al-Qura, Makkah' },
  { key: 'Tehran',             label: 'Institute of Geophysics, Tehran' },
  { key: 'Turkey',             label: 'Diyanet İşleri Başkanlığı, Turkey' },
];

export const WAKE_OFFSETS: { value: 0 | 15 | 30 | 45; label: string }[] = [
  { value: 0,  label: 'At Fajr' },
  { value: 15, label: '15 min before' },
  { value: 30, label: '30 min before' },
  { value: 45, label: '45 min before' },
];

// Adhan audio is streamed at runtime from ADHAN_SOURCES in AlarmRingingScreen.tsx
