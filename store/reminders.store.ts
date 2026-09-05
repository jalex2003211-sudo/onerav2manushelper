import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ReminderLanguage } from '@/lib/streak-reminders';

export interface StreakReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
  language: ReminderLanguage;
  notificationId: string | null;
}

interface RemindersStore {
  settings: StreakReminderSettings;
  setSettings: (settings: Partial<StreakReminderSettings>) => void;
  setNotificationId: (notificationId: string | null) => void;
  reset: () => void;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = '@onera_v2_streak_reminder';

export const DEFAULT_REMINDER_SETTINGS: StreakReminderSettings = {
  enabled: false,
  hour: 20,
  minute: 0,
  language: 'en',
  notificationId: null,
};

export const useRemindersStore = create<RemindersStore>((set, get) => ({
  settings: { ...DEFAULT_REMINDER_SETTINGS },

  setSettings: (settings) => {
    const next = { ...get().settings, ...settings };
    set({ settings: next });
    persist(next);
  },

  setNotificationId: (notificationId) => {
    const next = { ...get().settings, notificationId };
    set({ settings: next });
    persist(next);
  },

  reset: () => {
    set({ settings: { ...DEFAULT_REMINDER_SETTINGS } });
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<StreakReminderSettings>;
      set({ settings: { ...DEFAULT_REMINDER_SETTINGS, ...saved } });
    } catch {
      // Ignore malformed local data and keep the safe default.
    }
  },
}));

function persist(settings: StreakReminderSettings) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings)).catch(() => {});
}
