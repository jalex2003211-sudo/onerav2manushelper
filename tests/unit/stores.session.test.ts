/**
 * Onera v2 — Session Store Unit Tests
 * Coverage: startSession, advanceQuestion, switchTurn, saveMoment/unsaveMoment,
 *           endSession (double-call guard, phasesCompleted), reset, history cap
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSessionStore } from '@/store/session.store';

// Mock AsyncStorage so tests don't touch the filesystem
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
  },
}));

beforeEach(() => {
  useSessionStore.getState().reset();
});

// ---------------------------------------------------------------------------
describe('Session Store — startSession', () => {
  it('sets isActive to true and loads 10 questions', () => {
    useSessionStore.getState().startSession('curiosity');
    const s = useSessionStore.getState();
    expect(s.isActive).toBe(true);
    expect(s.questions).toHaveLength(10);
    expect(s.deckId).toBe('curiosity');
  });

  it('resets currentIndex to 0 on each new session', () => {
    useSessionStore.getState().startSession('intimacy');
    useSessionStore.getState().advanceQuestion();
    useSessionStore.getState().startSession('intimacy');
    expect(useSessionStore.getState().currentIndex).toBe(0);
  });

  it('sets turnOwner to A at session start', () => {
    useSessionStore.getState().startSession('reflection');
    expect(useSessionStore.getState().turnOwner).toBe('A');
  });

  it('clears aiFollowUp from previous session', () => {
    useSessionStore.getState().startSession('curiosity');
    useSessionStore.getState().setAIFollowUp('Some follow-up question?');
    useSessionStore.getState().startSession('curiosity');
    expect(useSessionStore.getState().aiFollowUp).toBeNull();
  });

  it('assigns a unique sessionId each time (with time advance)', async () => {
    useSessionStore.getState().startSession('curiosity');
    const id1 = useSessionStore.getState().sessionId;
    useSessionStore.getState().endSession();
    // Advance time by 1ms so Date.now() produces a different value
    await new Promise((r) => setTimeout(r, 1));
    useSessionStore.getState().startSession('curiosity');
    const id2 = useSessionStore.getState().sessionId;
    expect(id1).not.toBe(id2);
  });
});

// ---------------------------------------------------------------------------
describe('Session Store — advanceQuestion', () => {
  it('increments currentIndex by 1', () => {
    useSessionStore.getState().startSession('curiosity');
    useSessionStore.getState().advanceQuestion();
    expect(useSessionStore.getState().currentIndex).toBe(1);
  });

  it('does not advance past the last question', () => {
    useSessionStore.getState().startSession('curiosity');
    for (let i = 0; i < 20; i++) {
      useSessionStore.getState().advanceQuestion();
    }
    const { currentIndex, questions } = useSessionStore.getState();
    expect(currentIndex).toBeLessThan(questions.length);
  });

  it('updates currentPhase to match the new question', () => {
    useSessionStore.getState().startSession('curiosity');
    const { questions } = useSessionStore.getState();
    useSessionStore.getState().advanceQuestion();
    const expectedPhase = questions[1]?.phase;
    expect(useSessionStore.getState().currentPhase).toBe(expectedPhase);
  });

  it('resets turnOwner to A after advancing', () => {
    useSessionStore.getState().startSession('curiosity');
    useSessionStore.getState().switchTurn(); // B
    useSessionStore.getState().advanceQuestion();
    expect(useSessionStore.getState().turnOwner).toBe('A');
  });

  it('clears aiFollowUp after advancing', () => {
    useSessionStore.getState().startSession('curiosity');
    useSessionStore.getState().setAIFollowUp('A follow-up?');
    useSessionStore.getState().advanceQuestion();
    expect(useSessionStore.getState().aiFollowUp).toBeNull();
  });
});

// ---------------------------------------------------------------------------
describe('Session Store — switchTurn', () => {
  it('toggles from A to B', () => {
    useSessionStore.getState().startSession('curiosity');
    useSessionStore.getState().switchTurn();
    expect(useSessionStore.getState().turnOwner).toBe('B');
  });

  it('toggles from B back to A', () => {
    useSessionStore.getState().startSession('curiosity');
    useSessionStore.getState().switchTurn();
    useSessionStore.getState().switchTurn();
    expect(useSessionStore.getState().turnOwner).toBe('A');
  });
});

// ---------------------------------------------------------------------------
describe('Session Store — saveMoment / unsaveMoment', () => {
  it('marks a question as saved', () => {
    useSessionStore.getState().startSession('curiosity');
    const qId = useSessionStore.getState().questions[0].id;
    useSessionStore.getState().saveMoment(qId);
    expect(useSessionStore.getState().isMomentSaved(qId)).toBe(true);
  });

  it('unmarks a saved question', () => {
    useSessionStore.getState().startSession('curiosity');
    const qId = useSessionStore.getState().questions[0].id;
    useSessionStore.getState().saveMoment(qId);
    useSessionStore.getState().unsaveMoment(qId);
    expect(useSessionStore.getState().isMomentSaved(qId)).toBe(false);
  });

  it('isMomentSaved returns false for unsaved questions', () => {
    useSessionStore.getState().startSession('curiosity');
    expect(useSessionStore.getState().isMomentSaved('nonexistent-id')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
describe('Session Store — endSession', () => {
  it('returns a SessionHistoryItem with correct fields', () => {
    useSessionStore.getState().startSession('curiosity');
    useSessionStore.getState().setConnectionScore(8);
    const item = useSessionStore.getState().endSession();
    expect(item).not.toBeNull();
    expect(item!.deckId).toBe('curiosity');
    expect(item!.connectionScore).toBe(8);
    expect(item!.completedAt).toBeTruthy();
  });

  it('sets isActive to false after ending', () => {
    useSessionStore.getState().startSession('curiosity');
    useSessionStore.getState().endSession();
    expect(useSessionStore.getState().isActive).toBe(false);
  });

  it('appends the item to sessionHistory', () => {
    useSessionStore.getState().startSession('curiosity');
    useSessionStore.getState().endSession();
    expect(useSessionStore.getState().sessionHistory).toHaveLength(1);
  });

  it('guards against double-call: second call returns null', () => {
    useSessionStore.getState().startSession('curiosity');
    useSessionStore.getState().endSession();
    const second = useSessionStore.getState().endSession();
    expect(second).toBeNull();
  });

  it('does not create a duplicate history entry on double-call', () => {
    useSessionStore.getState().startSession('curiosity');
    useSessionStore.getState().endSession();
    useSessionStore.getState().endSession();
    expect(useSessionStore.getState().sessionHistory).toHaveLength(1);
  });

  it('computes phasesCompleted = 1 when only warmup questions were answered', () => {
    useSessionStore.getState().startSession('curiosity');
    // Stay at index 0 (warmup phase)
    const item = useSessionStore.getState().endSession();
    expect(item!.phasesCompleted).toBe(1);
  });

  it('includes savedMomentIds in the history item', () => {
    useSessionStore.getState().startSession('curiosity');
    const qId = useSessionStore.getState().questions[0].id;
    useSessionStore.getState().saveMoment(qId);
    const item = useSessionStore.getState().endSession();
    expect(item!.savedMomentIds).toContain(qId);
  });

  it('caps sessionHistory at 50 entries', () => {
    for (let i = 0; i < 55; i++) {
      useSessionStore.getState().startSession('curiosity');
      useSessionStore.getState().endSession();
    }
    expect(useSessionStore.getState().sessionHistory.length).toBeLessThanOrEqual(50);
  });
});

// ---------------------------------------------------------------------------
describe('Session Store — AI follow-up state', () => {
  it('setAIFollowUp stores a follow-up question', () => {
    useSessionStore.getState().setAIFollowUp('What made you feel that way?');
    expect(useSessionStore.getState().aiFollowUp).toBe('What made you feel that way?');
  });

  it('setAIFollowUp(null) clears the follow-up', () => {
    useSessionStore.getState().setAIFollowUp('Something');
    useSessionStore.getState().setAIFollowUp(null);
    expect(useSessionStore.getState().aiFollowUp).toBeNull();
  });

  it('setLoadingAI toggles the loading flag', () => {
    useSessionStore.getState().setLoadingAI(true);
    expect(useSessionStore.getState().isLoadingAI).toBe(true);
    useSessionStore.getState().setLoadingAI(false);
    expect(useSessionStore.getState().isLoadingAI).toBe(false);
  });
});

// ---------------------------------------------------------------------------
describe('Session Store — reset', () => {
  it('clears all active session state', () => {
    useSessionStore.getState().startSession('curiosity');
    useSessionStore.getState().reset();
    const s = useSessionStore.getState();
    expect(s.isActive).toBe(false);
    expect(s.questions).toHaveLength(0);
    expect(s.sessionId).toBeNull();
    expect(s.currentIndex).toBe(0);
  });
});
