// Privacy-safe product analytics (PostHog). No-op until API key is configured.
//
// Setup after publishing:
// 1. Create a free project at https://posthog.com
// 2. Copy the Project API Key (starts with phc_)
// 3. Add to .env: EXPO_PUBLIC_POSTHOG_API_KEY=phc_your_key_here
// 4. Rebuild the app (env vars are baked in at build time)
//
// Dashboard shows: DAU/MAU, retention, funnels, event breakdowns.
// App Store / Play Console only show downloads — not in-app behavior.
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { AnalyticsEventName } from '../constants/AnalyticsEvents';

const DISTINCT_ID_KEY = 'analytics_distinct_id';
const DEFAULT_HOST = 'https://us.i.posthog.com';

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

let distinctId: string | null = null;
let initialized = false;

function getConfig() {
  const extra = Constants.expoConfig?.extra ?? {};
  const apiKey =
    process.env.EXPO_PUBLIC_POSTHOG_API_KEY ??
    (extra.posthogApiKey as string | undefined) ??
    '';
  const host =
    process.env.EXPO_PUBLIC_POSTHOG_HOST ??
    (extra.posthogHost as string | undefined) ??
    DEFAULT_HOST;

  return { apiKey: apiKey.trim(), host: host.replace(/\/$/, '') };
}

export function isAnalyticsEnabled(): boolean {
  return getConfig().apiKey.length > 0;
}

function generateDistinctId(): string {
  return `fc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 11)}`;
}

export async function getDistinctId(): Promise<string> {
  if (distinctId) return distinctId;

  const stored = await AsyncStorage.getItem(DISTINCT_ID_KEY);
  if (stored) {
    distinctId = stored;
    return stored;
  }

  const id = generateDistinctId();
  await AsyncStorage.setItem(DISTINCT_ID_KEY, id);
  distinctId = id;
  return id;
}

async function postToPostHog(body: Record<string, unknown>): Promise<void> {
  const { apiKey, host } = getConfig();
  if (!apiKey) return;

  try {
    await fetch(`${host}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, ...body }),
    });
  } catch {
    // Never block the app for analytics
  }
}

export async function initAnalytics(): Promise<void> {
  if (initialized) return;
  initialized = true;

  const id = await getDistinctId();
  if (!isAnalyticsEnabled()) return;

  await postToPostHog({
    event: '$identify',
    distinct_id: id,
    properties: {
      $lib: 'fajr-companion',
      platform: Platform.OS,
      app_version: Constants.expoConfig?.version ?? 'unknown',
    },
  });
}

export async function track(
  event: AnalyticsEventName | string,
  properties?: AnalyticsProperties,
): Promise<void> {
  if (!isAnalyticsEnabled()) return;

  const id = await getDistinctId();
  await postToPostHog({
    event,
    distinct_id: id,
    properties: {
      ...properties,
      platform: Platform.OS,
      app_version: Constants.expoConfig?.version ?? 'unknown',
    },
  });
}

export async function trackScreen(screenName: string): Promise<void> {
  await track('screen_view', { screen: screenName });
}

/** For tests — reset module state */
export function __resetAnalyticsForTests(): void {
  distinctId = null;
  initialized = false;
}
