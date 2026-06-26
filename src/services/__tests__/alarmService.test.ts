import * as Notifications from 'expo-notifications';
import {
  scheduleAlarm,
  scheduleSnooze,
  cancelAlarm,
  cancelAllAlarms,
  requestNotificationPermission,
  getNotificationPermissionStatus,
} from '../alarmService';

const scheduleMock = Notifications.scheduleNotificationAsync as jest.Mock;
const cancelMock = Notifications.cancelScheduledNotificationAsync as jest.Mock;
const cancelAllMock = Notifications.cancelAllScheduledNotificationsAsync as jest.Mock;
const getPermMock = Notifications.getPermissionsAsync as jest.Mock;
const requestPermMock = Notifications.requestPermissionsAsync as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('scheduleAlarm', () => {
  it('schedules at fajr minus offset when that time is still in the future', async () => {
    jest.setSystemTime(new Date('2026-06-27T02:00:00'));
    const fajrTime = new Date('2026-06-27T04:30:00');

    const id = await scheduleAlarm(fajrTime, 15);

    expect(id).toBe('test-notification-id');
    expect(scheduleMock).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: '🕌 Fajr Time',
          data: { type: 'fajr_alarm' },
        }),
        trigger: {
          type: 'date',
          date: new Date('2026-06-27T04:15:00'),
        },
      }),
    );
  });

  it('rolls to the next day when trigger time is already in the past', async () => {
    jest.setSystemTime(new Date('2026-06-27T10:00:00'));
    const fajrTime = new Date('2026-06-27T04:30:00');

    await scheduleAlarm(fajrTime, 0);

    const call = scheduleMock.mock.calls[0][0];
    expect(call.trigger.date.getDate()).toBe(28);
  });
});

describe('scheduleSnooze', () => {
  it('schedules a snooze notification N minutes from now', async () => {
    await scheduleSnooze(5);

    expect(scheduleMock).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: '🕌 Fajr — Snooze Over',
          data: { type: 'fajr_alarm' },
        }),
        trigger: {
          type: 'timeInterval',
          seconds: 300,
        },
      }),
    );
  });
});

describe('cancelAlarm', () => {
  it('cancels a notification by id', async () => {
    await cancelAlarm('alarm-123');
    expect(cancelMock).toHaveBeenCalledWith('alarm-123');
  });
});

describe('cancelAllAlarms', () => {
  it('cancels all scheduled notifications', async () => {
    await cancelAllAlarms();
    expect(cancelAllMock).toHaveBeenCalled();
  });
});

describe('notification permissions', () => {
  it('returns granted status', async () => {
    getPermMock.mockResolvedValueOnce({ status: 'granted' });
    await expect(getNotificationPermissionStatus()).resolves.toBe('granted');
  });

  it('returns denied status', async () => {
    getPermMock.mockResolvedValueOnce({ status: 'denied' });
    await expect(getNotificationPermissionStatus()).resolves.toBe('denied');
  });

  it('requests permission and returns true when granted', async () => {
    requestPermMock.mockResolvedValueOnce({ status: 'granted' });
    await expect(requestNotificationPermission()).resolves.toBe(true);
  });

  it('returns false when permission is denied', async () => {
    requestPermMock.mockResolvedValueOnce({ status: 'denied' });
    await expect(requestNotificationPermission()).resolves.toBe(false);
  });
});
