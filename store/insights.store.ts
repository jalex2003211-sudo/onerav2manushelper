import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface InsightEntry {
  id: string;
  insightType: 'weekly' | 'monthly';
  content: string;
  themes: string[];
  generatedAt: string;
}

interface InsightsStore {
  insights: InsightEntry[];
  latestInsight: InsightEntry | null;
  isGenerating: boolean;
  setInsights: (insights: InsightEntry[]) => void;
  addInsight: (insight: InsightEntry) => void;
  setGenerating: (value: boolean) => void;
  reset: () => void;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = '@onera_v2_insights';

export const useInsightsStore = create<InsightsStore>((set, get) => ({
  insights: [],
  latestInsight: null,
  isGenerating: false,

  setInsights: (insights) => {
    const sorted = [...insights].sort(
      (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime(),
    );
    set({ insights: sorted, latestInsight: sorted[0] ?? null });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sorted)).catch(() => {});
  },

  addInsight: (insight) => {
    const current = get().insights;
    const updated = [insight, ...current].slice(0, 12); // keep last 12
    set({ insights: updated, latestInsight: updated[0] });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
  },

  setGenerating: (value) => set({ isGenerating: value }),

  reset: () => {
    set({ insights: [], latestInsight: null, isGenerating: false });
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as InsightEntry[];
        set({ insights: saved, latestInsight: saved[0] ?? null });
      }
    } catch {}
  },
}));
