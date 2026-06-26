// Analytics event names — keep stable for dashboard filters
export const AnalyticsEvents = {
  APP_OPENED:           'app_opened',
  SCREEN_VIEW:          'screen_view',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ALARM_TOGGLED:        'alarm_toggled',
  ALARM_OFFSET_CHANGED: 'alarm_offset_changed',
  CITY_CHANGED:         'city_changed',
  NOTIFICATION_OPENED:  'notification_opened',
  ALARM_AWAKE:          'alarm_awake',
  ALARM_SNOOZED:        'alarm_snoozed',
  FAJR_CONFIRMED:       'fajr_confirmed',
} as const;

export type AnalyticsEventName = typeof AnalyticsEvents[keyof typeof AnalyticsEvents];

/** Bucket streak counts so dashboards stay useful without exposing exact counts. */
export function streakBucket(count: number): string {
  if (count <= 1) return '1';
  if (count <= 7) return '2-7';
  if (count <= 30) return '8-30';
  return '31+';
}
