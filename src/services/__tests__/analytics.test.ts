import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  __resetAnalyticsForTests,
  getDistinctId,
  initAnalytics,
  isAnalyticsEnabled,
  track,
} from '../analytics';
import { streakBucket } from '../../constants/AnalyticsEvents';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      version: '1.0.0',
      extra: {},
    },
  },
}));

const fetchMock = jest.fn(async () => ({ ok: true }));
global.fetch = fetchMock as unknown as typeof fetch;

describe('streakBucket', () => {
  it('groups streak counts for privacy-safe dashboards', () => {
    expect(streakBucket(1)).toBe('1');
    expect(streakBucket(5)).toBe('2-7');
    expect(streakBucket(20)).toBe('8-30');
    expect(streakBucket(100)).toBe('31+');
  });
});

describe('analytics service', () => {
  beforeEach(async () => {
    __resetAnalyticsForTests();
    fetchMock.mockClear();
    await AsyncStorage.clear();
    delete process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
  });

  it('is disabled when no API key is configured', () => {
    expect(isAnalyticsEnabled()).toBe(false);
  });

  it('does not call fetch when disabled', async () => {
    await track('test_event', { foo: 'bar' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('persists an anonymous distinct id', async () => {
    const id1 = await getDistinctId();
    __resetAnalyticsForTests();
    const id2 = await getDistinctId();
    expect(id1).toBe(id2);
    expect(id1.startsWith('fc_')).toBe(true);
  });

  it('sends events to PostHog when API key is set', async () => {
    process.env.EXPO_PUBLIC_POSTHOG_API_KEY = 'phc_test_key';

    await initAnalytics();
    await track('alarm_toggled', { enabled: true });

    expect(fetchMock).toHaveBeenCalled();
    const identifyBody = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
    expect(identifyBody.api_key).toBe('phc_test_key');
    expect(identifyBody.event).toBe('$identify');

    const eventBody = JSON.parse(fetchMock.mock.calls[1][1]?.body as string);
    expect(eventBody.event).toBe('alarm_toggled');
    expect(eventBody.properties.enabled).toBe(true);
    expect(eventBody.distinct_id).toMatch(/^fc_/);
  });
});
