jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(async () => 'test-notification-id'),
  cancelScheduledNotificationAsync: jest.fn(async () => undefined),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => undefined),
  SchedulableTriggerInputTypes: {
    DATE: 'date',
    TIME_INTERVAL: 'timeInterval',
  },
}));

jest.mock('tz-lookup', () => jest.fn((lat, lon) => {
  if (lat > 50 && lon > -10 && lon < 2) return 'Europe/Dublin';
  if (lat > 24 && lat < 25 && lon > 67 && lon < 68) return 'Asia/Karachi';
  return 'America/New_York';
}));
