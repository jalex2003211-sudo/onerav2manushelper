import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DeckId } from '@/lib/data/questions';

export interface SavedMoment {
  id: string;
  questionId: string;
  questionText: string;
  deckId: DeckId;
  savedAt: number;
}

interface MomentsStore {
  moments: SavedMoment[];
  addMoment: (moment: Omit<SavedMoment, 'savedAt'>) => void;
  removeMoment: (questionId: string) => void;
  isSaved: (questionId: string) => boolean;
  clearAll: () => void;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = '@onera_v2_moments';

export const useMomentsStore = create<MomentsStore>((set, get) => ({
  moments: [],

  addMoment: (moment) => {
    if (get().isSaved(moment.questionId)) return;
    const entry: SavedMoment = { ...moment, savedAt: Date.now() };
    const updated = [entry, ...get().moments];
    set({ moments: updated });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
  },

  removeMoment: (questionId) => {
    const updated = get().moments.filter((m) => m.questionId !== questionId);
    set({ moments: updated });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
  },

  isSaved: (questionId) => get().moments.some((m) => m.questionId === questionId),

  clearAll: () => {
    set({ moments: [] });
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as SavedMoment[];
        set({ moments: saved });
      }
    } catch {}
  },
}));
