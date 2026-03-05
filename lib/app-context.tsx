import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DeckId, RelationshipStage, Question } from './data/questions';

const STORAGE_KEY = '@onera_state_v1';

export interface Partner {
  name: string;
  avatar: string; // emoji
}

export interface SavedMoment {
  id: string;
  questionText: string;
  deckId: DeckId;
  savedAt: number;
}

export interface AppState {
  isSetupComplete: boolean;
  partnerA: Partner;
  partnerB: Partner;
  relationshipStage: RelationshipStage;
  savedMoments: SavedMoment[];
  lastSessionDate: string | null;
}

const DEFAULT_STATE: AppState = {
  isSetupComplete: false,
  partnerA: { name: '', avatar: '🌸' },
  partnerB: { name: '', avatar: '🌿' },
  relationshipStage: 'dating',
  savedMoments: [],
  lastSessionDate: null,
};

type Action =
  | { type: 'COMPLETE_SETUP'; partnerA: Partner; partnerB: Partner; stage: RelationshipStage }
  | { type: 'UPDATE_STAGE'; stage: RelationshipStage }
  | { type: 'UPDATE_PARTNERS'; partnerA: Partner; partnerB: Partner }
  | { type: 'SAVE_MOMENT'; moment: SavedMoment }
  | { type: 'REMOVE_MOMENT'; id: string }
  | { type: 'RECORD_SESSION' }
  | { type: 'RESET' }
  | { type: 'HYDRATE'; state: AppState };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'COMPLETE_SETUP':
      return {
        ...state,
        isSetupComplete: true,
        partnerA: action.partnerA,
        partnerB: action.partnerB,
        relationshipStage: action.stage,
      };
    case 'UPDATE_STAGE':
      return { ...state, relationshipStage: action.stage };
    case 'UPDATE_PARTNERS':
      return { ...state, partnerA: action.partnerA, partnerB: action.partnerB };
    case 'SAVE_MOMENT':
      if (state.savedMoments.find(m => m.id === action.moment.id)) return state;
      return { ...state, savedMoments: [action.moment, ...state.savedMoments] };
    case 'REMOVE_MOMENT':
      return { ...state, savedMoments: state.savedMoments.filter(m => m.id !== action.id) };
    case 'RECORD_SESSION':
      return { ...state, lastSessionDate: new Date().toISOString() };
    case 'RESET':
      return DEFAULT_STATE;
    case 'HYDRATE':
      return action.state;
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  completeSetup: (partnerA: Partner, partnerB: Partner, stage: RelationshipStage) => void;
  updateStage: (stage: RelationshipStage) => void;
  updatePartners: (partnerA: Partner, partnerB: Partner) => void;
  saveMoment: (question: Question) => void;
  removeMoment: (id: string) => void;
  recordSession: () => void;
  reset: () => void;
  isMomentSaved: (questionId: string) => boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);

  // Hydrate from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try {
          const saved = JSON.parse(raw) as AppState;
          dispatch({ type: 'HYDRATE', state: { ...DEFAULT_STATE, ...saved } });
        } catch {}
      }
    });
  }, []);

  // Persist on every state change
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const completeSetup = useCallback((partnerA: Partner, partnerB: Partner, stage: RelationshipStage) => {
    dispatch({ type: 'COMPLETE_SETUP', partnerA, partnerB, stage });
  }, []);

  const updateStage = useCallback((stage: RelationshipStage) => {
    dispatch({ type: 'UPDATE_STAGE', stage });
  }, []);

  const updatePartners = useCallback((partnerA: Partner, partnerB: Partner) => {
    dispatch({ type: 'UPDATE_PARTNERS', partnerA, partnerB });
  }, []);

  const saveMoment = useCallback((question: Question) => {
    dispatch({
      type: 'SAVE_MOMENT',
      moment: {
        id: question.id,
        questionText: question.text,
        deckId: question.deck,
        savedAt: Date.now(),
      },
    });
  }, []);

  const removeMoment = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_MOMENT', id });
  }, []);

  const recordSession = useCallback(() => {
    dispatch({ type: 'RECORD_SESSION' });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const isMomentSaved = useCallback((questionId: string) => {
    return state.savedMoments.some(m => m.id === questionId);
  }, [state.savedMoments]);

  return (
    <AppContext.Provider value={{
      state,
      completeSetup,
      updateStage,
      updatePartners,
      saveMoment,
      removeMoment,
      recordSession,
      reset,
      isMomentSaved,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
