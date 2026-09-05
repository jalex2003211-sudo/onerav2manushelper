import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = vi.hoisted(() => new Map<string, string>());

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => storage.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      storage.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => {
      storage.delete(key);
    }),
  },
}));

import { DEFAULT_REMINDER_SETTINGS, useRemindersStore } from '@/store/reminders.store';

describe('reminders store', () => {
  beforeEach(() => {
    storage.clear();
    useRemindersStore.getState().reset();
  });

  it('starts disabled and does not schedule anything by default', () => {
    expect(useRemindersStore.getState().settings).toEqual(DEFAULT_REMINDER_SETTINGS);
  });

  it('persists preferences without enabling the reminder implicitly', () => {
    useRemindersStore.getState().setSettings({ hour: 21, minute: 0, language: 'el' });

    expect(useRemindersStore.getState().settings).toMatchObject({
      enabled: false,
      hour: 21,
      minute: 0,
      language: 'el',
    });
    expect(JSON.parse(storage.get('@onera_v2_streak_reminder') ?? '{}')).toMatchObject({
      enabled: false,
      hour: 21,
      minute: 0,
      language: 'el',
    });
  });

  it('hydrates saved settings while retaining defaults for missing fields', async () => {
    storage.set('@onera_v2_streak_reminder', JSON.stringify({ enabled: true, hour: 19 }));

    await useRemindersStore.getState().hydrate();

    expect(useRemindersStore.getState().settings).toEqual({
      ...DEFAULT_REMINDER_SETTINGS,
      enabled: true,
      hour: 19,
    });
  });
});
