jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-constants', () => ({
  expoConfig: { extra: {} },
  appOwnership: 'standalone',
  executionEnvironment: 'standalone',
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => undefined),
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(async () => 'test-notification-id'),
  cancelScheduledNotificationAsync: jest.fn(async () => undefined),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => undefined),
  AndroidImportance: { MAX: 5 },
  SchedulableTriggerInputTypes: {
    DATE: 'date',
    TIME_INTERVAL: 'timeInterval',
  },
}));

jest.mock('react-native-image-colors', () => ({
  __esModule: true,
  default: {
    getColors: jest.fn(async () => ({
      platform: 'ios',
      background: '#8B1E2D',
      primary: '#1E3A5F',
      secondary: '#C9A227',
      detail: '#F5E6D3',
      quality: 'low',
    })),
  },
}));

jest.mock('tz-lookup', () => jest.fn((lat, lon) => {
  if (lat > 50 && lon > -10 && lon < 2) return 'Europe/Dublin';
  if (lat > 24 && lat < 25 && lon > 67 && lon < 68) return 'Asia/Karachi';
  return 'America/New_York';
}));
