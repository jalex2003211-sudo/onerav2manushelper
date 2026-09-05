import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  scheduleNotificationAsync: vi.fn().mockResolvedValue('notification-1'),
  cancelScheduledNotificationAsync: vi.fn().mockResolvedValue(undefined),
  getPermissionsAsync: vi.fn().mockResolvedValue({ granted: true, ios: { status: 3 } }),
  requestPermissionsAsync: vi.fn().mockResolvedValue({ granted: true, ios: { status: 3 } }),
  setNotificationHandler: vi.fn(),
  setNotificationChannelAsync: vi.fn().mockResolvedValue(null),
}));

vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('expo-notifications', () => ({
  AndroidImportance: { DEFAULT: 3 },
  IosAuthorizationStatus: { PROVISIONAL: 3 },
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
  setNotificationHandler: mocks.setNotificationHandler,
  setNotificationChannelAsync: mocks.setNotificationChannelAsync,
  getPermissionsAsync: mocks.getPermissionsAsync,
  requestPermissionsAsync: mocks.requestPermissionsAsync,
  scheduleNotificationAsync: mocks.scheduleNotificationAsync,
  cancelScheduledNotificationAsync: mocks.cancelScheduledNotificationAsync,
}));

import {
  cancelStreakReminder,
  getStreakReminderCopy,
  scheduleStreakReminder,
} from '@/lib/streak-reminders';

describe('streak reminders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates warm English copy with the current streak', () => {
    expect(getStreakReminderCopy('en', 'Alex', 'Sam', 7)).toEqual({
      title: 'Alex & Sam, keep your 7-day rhythm',
      body: 'One thoughtful question is all it takes to keep your connection going.',
    });
  });

  it('creates Greek copy without changing the scheduling contract', () => {
    const copy = getStreakReminderCopy('el', 'Άλεξ', 'Σαμ', 0);
    expect(copy.title).toBe('Λίγος χρόνος μόνο για εσάς');
    expect(copy.body).toContain('σύνδεσή');
  });

  it('cancels the previous notification before scheduling a replacement', async () => {
    const id = await scheduleStreakReminder({
      hour: 20,
      minute: 0,
      language: 'en',
      partnerAName: 'Alex',
      partnerBName: 'Sam',
      streakCount: 2,
      previousNotificationId: 'old-notification',
    });

    expect(mocks.cancelScheduledNotificationAsync).toHaveBeenCalledWith('old-notification');
    expect(mocks.scheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({
      trigger: expect.objectContaining({ type: 'daily', hour: 20, minute: 0 }),
    }));
    expect(id).toBe('notification-1');
  });

  it('cancels a scheduled reminder safely', async () => {
    await cancelStreakReminder('notification-1');
    await cancelStreakReminder(null);

    expect(mocks.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(1);
    expect(mocks.cancelScheduledNotificationAsync).toHaveBeenCalledWith('notification-1');
  });
});
