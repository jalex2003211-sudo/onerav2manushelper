import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RelationshipStage } from '@/lib/data/questions';

export interface PartnerProfile {
  id?: number;
  name: string;
  avatar: string;
}

export interface CoupleState {
  id?: number;
  partnerA: PartnerProfile;
  partnerB: PartnerProfile;
  relationshipStage: RelationshipStage;
  streakCount: number;
  lastActiveDate: string | null;
  inviteCode: string | null;
  isSetupComplete: boolean;
  isPremium: boolean;
}

interface PartnersStore extends CoupleState {
  // Actions
  setCouple: (couple: Partial<CoupleState>) => void;
  completeSetup: (
    partnerA: PartnerProfile,
    partnerB: PartnerProfile,
    stage: RelationshipStage,
  ) => void;
  updatePartners: (partnerA: PartnerProfile, partnerB: PartnerProfile) => void;
  updateStage: (stage: RelationshipStage) => void;
  incrementStreak: () => void;
  markActiveToday: () => void;
  setPremium: (value: boolean) => void;
  reset: () => void;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = '@onera_v2_couple';

const DEFAULT_STATE: CoupleState = {
  partnerA: { name: '', avatar: '🌸' },
  partnerB: { name: '', avatar: '🌿' },
  relationshipStage: 'dating',
  streakCount: 0,
  lastActiveDate: null,
  inviteCode: null,
  isSetupComplete: false,
  isPremium: false,
};

export const usePartnersStore = create<PartnersStore>((set, get) => ({
  ...DEFAULT_STATE,

  setCouple: (couple) => {
    set((s) => ({ ...s, ...couple }));
    persist(get());
  },

  completeSetup: (partnerA, partnerB, stage) => {
    set({ partnerA, partnerB, relationshipStage: stage, isSetupComplete: true });
    persist(get());
  },

  updatePartners: (partnerA, partnerB) => {
    set({ partnerA, partnerB });
    persist(get());
  },

  updateStage: (stage) => {
    set({ relationshipStage: stage });
    persist(get());
  },

  incrementStreak: () => {
    set((s) => ({ streakCount: s.streakCount + 1 }));
    persist(get());
  },

  markActiveToday: () => {
    const today = new Date().toISOString().split('T')[0];
    const { lastActiveDate, streakCount } = get();

    if (lastActiveDate === today) return; // already marked today

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const newStreak = lastActiveDate === yesterday ? streakCount + 1 : 1;

    set({ lastActiveDate: today, streakCount: newStreak });
    persist(get());
  },

  setPremium: (value) => {
    set({ isPremium: value });
    persist(get());
  },

  reset: () => {
    set(DEFAULT_STATE);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<CoupleState>;
        set((s) => ({ ...s, ...saved }));
      }
    } catch {}
  },
}));

function persist(state: CoupleState) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
}
