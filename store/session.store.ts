import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildSession } from '@/lib/data/questions';
import type { Question, DeckId, Phase } from '@/lib/data/questions';

export interface SessionState {
  // Active session
  isActive: boolean;
  sessionId: string | null;
  deckId: DeckId | null;
  questions: Question[];
  currentIndex: number;
  currentPhase: Phase;
  turnOwner: 'A' | 'B';
  savedMomentIds: Set<string>;
  aiFollowUp: string | null;
  isLoadingAI: boolean;
  connectionScore: number | null;

  // History (lightweight local cache)
  sessionHistory: SessionHistoryItem[];
}

export interface SessionHistoryItem {
  id: string;
  deckId: DeckId;
  questionCount: number;
  phasesCompleted: number;
  connectionScore: number | null;
  savedMomentIds: string[];
  completedAt: string;
}

interface SessionStore extends SessionState {
  startSession: (deckId: DeckId) => void;
  advanceQuestion: () => void;
  switchTurn: () => void;
  saveMoment: (questionId: string) => void;
  unsaveMoment: (questionId: string) => void;
  isMomentSaved: (questionId: string) => boolean;
  setAIFollowUp: (question: string | null) => void;
  setLoadingAI: (loading: boolean) => void;
  setConnectionScore: (score: number) => void;
  endSession: () => SessionHistoryItem | null;
  reset: () => void;
  hydrateHistory: () => Promise<void>;
}

const HISTORY_KEY = '@onera_v2_session_history';

const DEFAULT_STATE: SessionState = {
  isActive: false,
  sessionId: null,
  deckId: null,
  questions: [],
  currentIndex: 0,
  currentPhase: 'warmup',
  turnOwner: 'A',
  savedMomentIds: new Set(),
  aiFollowUp: null,
  isLoadingAI: false,
  connectionScore: null,
  sessionHistory: [],
};

export const useSessionStore = create<SessionStore>((set, get) => ({
  ...DEFAULT_STATE,

  startSession: (deckId) => {
    const questions = buildSession(deckId, 10);
    set({
      isActive: true,
      sessionId: `session_${Date.now()}`,
      deckId,
      questions,
      currentIndex: 0,
      currentPhase: questions[0]?.phase ?? 'warmup',
      turnOwner: 'A',
      savedMomentIds: new Set(),
      aiFollowUp: null,
      isLoadingAI: false,
      connectionScore: null,
    });
  },

  advanceQuestion: () => {
    const { currentIndex, questions } = get();
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) return;
    const nextQuestion = questions[nextIndex];
    set({
      currentIndex: nextIndex,
      currentPhase: nextQuestion?.phase ?? 'reflection',
      turnOwner: 'A',
      aiFollowUp: null,
    });
  },

  switchTurn: () => {
    set((s) => ({ turnOwner: s.turnOwner === 'A' ? 'B' : 'A' }));
  },

  saveMoment: (questionId) => {
    set((s) => {
      const next = new Set(s.savedMomentIds);
      next.add(questionId);
      return { savedMomentIds: next };
    });
  },

  unsaveMoment: (questionId) => {
    set((s) => {
      const next = new Set(s.savedMomentIds);
      next.delete(questionId);
      return { savedMomentIds: next };
    });
  },

  isMomentSaved: (questionId) => get().savedMomentIds.has(questionId),

  setAIFollowUp: (question) => set({ aiFollowUp: question }),

  setLoadingAI: (loading) => set({ isLoadingAI: loading }),

  setConnectionScore: (score) => set({ connectionScore: score }),

  endSession: () => {
    const { isActive, sessionId, deckId, questions, currentIndex, connectionScore, savedMomentIds, sessionHistory } = get();
    // Guard against double-call: if session is already ended, return null
    if (!isActive) return null;
    // Compute the number of unique phases the couple actually reached
    const questionsAnswered = questions.slice(0, currentIndex + 1);
    const phasesCompleted = new Set(questionsAnswered.map(q => q.phase)).size;
    const item: SessionHistoryItem = {
      id: sessionId ?? `session_${Date.now()}`,
      deckId: deckId!,
      questionCount: questionsAnswered.length,
      phasesCompleted,
      connectionScore,
      savedMomentIds: Array.from(savedMomentIds),
      completedAt: new Date().toISOString(),
    };
    const newHistory = [item, ...sessionHistory].slice(0, 50); // keep last 50
    set({ isActive: false, sessionHistory: newHistory });
    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory)).catch(() => {});
    return item;
  },

  reset: () => set(DEFAULT_STATE),

  hydrateHistory: async () => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      if (raw) {
        const history = JSON.parse(raw) as SessionHistoryItem[];
        set({ sessionHistory: history });
      }
    } catch {}
  },
}));
