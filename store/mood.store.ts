import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type MoodLabel =
  | 'calm'
  | 'connected'
  | 'tired'
  | 'anxious'
  | 'grateful'
  | 'distant'
  | 'playful'
  | 'tender';

export interface MoodEntry {
  id: string;
  mood: MoodLabel;
  visibleToPartner: boolean;
  createdAt: string;
}

interface MoodStore {
  myMood: MoodEntry | null;
  partnerMood: MoodEntry | null;
  recentMoods: MoodEntry[];
  setMyMood: (mood: MoodLabel, visibleToPartner: boolean) => void;
  setPartnerMood: (entry: MoodEntry | null) => void;
  reset: () => void;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = '@onera_v2_mood';

export const useMoodStore = create<MoodStore>((set, get) => ({
  myMood: null,
  partnerMood: null,
  recentMoods: [],

  setMyMood: (mood, visibleToPartner) => {
    const entry: MoodEntry = {
      id: `mood_${Date.now()}`,
      mood,
      visibleToPartner,
      createdAt: new Date().toISOString(),
    };
    const recentMoods = [entry, ...get().recentMoods].slice(0, 30);
    set({ myMood: entry, recentMoods });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ myMood: entry, recentMoods })).catch(() => {});
  },

  setPartnerMood: (entry) => set({ partnerMood: entry }),

  reset: () => {
    set({ myMood: null, partnerMood: null, recentMoods: [] });
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { myMood: MoodEntry; recentMoods: MoodEntry[] };
        set({ myMood: saved.myMood ?? null, recentMoods: saved.recentMoods ?? [] });
      }
    } catch {}
  },
}));

export const MOOD_META: Record<MoodLabel, { emoji: string; label: string; color: string }> = {
  calm: { emoji: '🌊', label: 'Calm', color: '#7A9FB0' },
  connected: { emoji: '🤝', label: 'Connected', color: '#8B9E7A' },
  tired: { emoji: '😴', label: 'Tired', color: '#A0A0A0' },
  anxious: { emoji: '🌀', label: 'Anxious', color: '#C4856A' },
  grateful: { emoji: '🌻', label: 'Grateful', color: '#D4A96A' },
  distant: { emoji: '🌫️', label: 'Distant', color: '#9BA1A6' },
  playful: { emoji: '✨', label: 'Playful', color: '#A07090' },
  tender: { emoji: '🌷', label: 'Tender', color: '#C4856A' },
};
