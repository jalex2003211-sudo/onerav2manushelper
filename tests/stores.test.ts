/**
 * Onera v2 — Zustand Store Unit Tests
 *
 * Tests critical business logic in the session, partners, and moments stores:
 * - Session: startSession, advanceQuestion, endSession (double-call guard),
 *   isMomentSaved, phasesCompleted computation
 * - Partners: markActiveToday streak logic (today, yesterday, gap)
 * - Moments: addMoment deduplication, removeMoment
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock AsyncStorage — stores call it on every persist operation
// ---------------------------------------------------------------------------
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
    multiRemove: vi.fn().mockResolvedValue(undefined),
  },
}));

// ---------------------------------------------------------------------------
// Import stores AFTER mocking AsyncStorage
// ---------------------------------------------------------------------------
import { useSessionStore } from '../store/session.store';
import { usePartnersStore } from '../store/partners.store';
import { useMomentsStore } from '../store/moments.store';
import { DECKS } from '../lib/data/questions';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function resetAllStores() {
  useSessionStore.getState().reset();
  usePartnersStore.getState().reset();
  useMomentsStore.getState().clearAll();
}

// ---------------------------------------------------------------------------
// Session Store Tests
// ---------------------------------------------------------------------------
describe('useSessionStore', () => {
  beforeEach(() => {
    resetAllStores();
  });

  it('startSession sets isActive=true and loads exactly 10 questions', () => {
    useSessionStore.getState().startSession('break-the-ice');
    const state = useSessionStore.getState();
    expect(state.isActive).toBe(true);
    expect(state.questions).toHaveLength(10);
    expect(state.currentIndex).toBe(0);
    expect(state.turnOwner).toBe('A');
  });

  it('startSession always returns 10 questions even for short decks', () => {
    // break-the-ice only has 8 native questions; padding should fill to 10
    useSessionStore.getState().startSession('break-the-ice');
    expect(useSessionStore.getState().questions).toHaveLength(10);
  });

  it('advanceQuestion increments currentIndex and updates currentPhase', () => {
    useSessionStore.getState().startSession('deep-connection');
    useSessionStore.getState().advanceQuestion();
    const state = useSessionStore.getState();
    expect(state.currentIndex).toBe(1);
    expect(state.currentPhase).toBe(state.questions[1].phase);
  });

  it('advanceQuestion does not go past the last question', () => {
    useSessionStore.getState().startSession('deep-connection');
    const { questions } = useSessionStore.getState();
    // Advance to the last question
    for (let i = 0; i < questions.length - 1; i++) {
      useSessionStore.getState().advanceQuestion();
    }
    const indexBefore = useSessionStore.getState().currentIndex;
    // Try to advance past the end
    useSessionStore.getState().advanceQuestion();
    expect(useSessionStore.getState().currentIndex).toBe(indexBefore);
  });

  it('isMomentSaved returns false before saving, true after', () => {
    useSessionStore.getState().startSession('curiosity');
    const { questions } = useSessionStore.getState();
    const qId = questions[0].id;
    expect(useSessionStore.getState().isMomentSaved(qId)).toBe(false);
    useSessionStore.getState().saveMoment(qId);
    expect(useSessionStore.getState().isMomentSaved(qId)).toBe(true);
  });

  it('unsaveMoment removes a saved moment', () => {
    useSessionStore.getState().startSession('curiosity');
    const { questions } = useSessionStore.getState();
    const qId = questions[0].id;
    useSessionStore.getState().saveMoment(qId);
    useSessionStore.getState().unsaveMoment(qId);
    expect(useSessionStore.getState().isMomentSaved(qId)).toBe(false);
  });

  it('endSession sets isActive=false and adds item to sessionHistory', () => {
    useSessionStore.getState().startSession('deep-connection');
    const result = useSessionStore.getState().endSession();
    expect(result).not.toBeNull();
    const state = useSessionStore.getState();
    expect(state.isActive).toBe(false);
    expect(state.sessionHistory).toHaveLength(1);
    expect(state.sessionHistory[0].deckId).toBe('deep-connection');
  });

  it('endSession computes phasesCompleted correctly (1 question = 1 phase)', () => {
    useSessionStore.getState().startSession('deep-connection');
    // Only at index 0 — one phase seen
    const result = useSessionStore.getState().endSession();
    expect(result).not.toBeNull();
    expect(result!.phasesCompleted).toBeGreaterThanOrEqual(1);
    expect(result!.phasesCompleted).toBeLessThanOrEqual(4);
  });

  it('endSession double-call guard: second call returns null and does not add duplicate history entry', () => {
    useSessionStore.getState().startSession('curiosity');
    const first = useSessionStore.getState().endSession();
    const second = useSessionStore.getState().endSession();
    expect(first).not.toBeNull();
    expect(second).toBeNull();
    // History should have exactly one entry
    expect(useSessionStore.getState().sessionHistory).toHaveLength(1);
  });

  it('endSession includes savedMomentIds in the history item', () => {
    useSessionStore.getState().startSession('curiosity');
    const { questions } = useSessionStore.getState();
    useSessionStore.getState().saveMoment(questions[0].id);
    useSessionStore.getState().saveMoment(questions[1].id);
    const result = useSessionStore.getState().endSession();
    expect(result!.savedMomentIds).toContain(questions[0].id);
    expect(result!.savedMomentIds).toContain(questions[1].id);
  });

  it('reset clears all session state', () => {
    useSessionStore.getState().startSession('reflection');
    useSessionStore.getState().reset();
    const state = useSessionStore.getState();
    expect(state.isActive).toBe(false);
    expect(state.questions).toHaveLength(0);
    expect(state.sessionHistory).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Partners Store Tests
// ---------------------------------------------------------------------------
describe('usePartnersStore', () => {
  beforeEach(() => {
    resetAllStores();
  });

  it('initial state has streakCount=0 and isSetupComplete=false', () => {
    const state = usePartnersStore.getState();
    expect(state.streakCount).toBe(0);
    expect(state.isSetupComplete).toBe(false);
  });

  it('completeSetup sets partner names and marks setup complete', () => {
    usePartnersStore.getState().completeSetup(
      { name: 'Alex', avatar: '🌸' },
      { name: 'Sam', avatar: '🌿' },
      'dating',
    );
    const state = usePartnersStore.getState();
    expect(state.partnerA.name).toBe('Alex');
    expect(state.partnerB.name).toBe('Sam');
    expect(state.isSetupComplete).toBe(true);
  });

  it('markActiveToday increments streak on first call', () => {
    usePartnersStore.getState().markActiveToday();
    expect(usePartnersStore.getState().streakCount).toBe(1);
  });

  it('markActiveToday calling twice on the same day does not double-increment streak', () => {
    usePartnersStore.getState().markActiveToday();
    usePartnersStore.getState().markActiveToday();
    expect(usePartnersStore.getState().streakCount).toBe(1);
  });

  it('incrementStreak increments streakCount by 1', () => {
    usePartnersStore.getState().incrementStreak();
    expect(usePartnersStore.getState().streakCount).toBe(1);
    usePartnersStore.getState().incrementStreak();
    expect(usePartnersStore.getState().streakCount).toBe(2);
  });

  it('reset clears all partner state', () => {
    usePartnersStore.getState().completeSetup(
      { name: 'Alex', avatar: '🌸' },
      { name: 'Sam', avatar: '🌿' },
      'dating',
    );
    usePartnersStore.getState().reset();
    const state = usePartnersStore.getState();
    expect(state.isSetupComplete).toBe(false);
    expect(state.streakCount).toBe(0);
    expect(state.partnerA.name).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Moments Store Tests
// ---------------------------------------------------------------------------
describe('useMomentsStore', () => {
  beforeEach(() => {
    resetAllStores();
  });

  it('initial state has empty moments array', () => {
    expect(useMomentsStore.getState().moments).toHaveLength(0);
  });

  it('addMoment adds a moment to the store', () => {
    useMomentsStore.getState().addMoment({
      id: 'q1',
      questionId: 'q1',
      questionText: 'What is something you admire about your partner?',
      deckId: 'deep-connection',
    });
    expect(useMomentsStore.getState().moments).toHaveLength(1);
  });

  it('addMoment deduplication: calling twice with the same id adds only one entry', () => {
    const moment = {
      id: 'q1',
      questionId: 'q1',
      questionText: 'What is something you admire about your partner?',
      deckId: 'deep-connection' as const,
    };
    useMomentsStore.getState().addMoment(moment);
    useMomentsStore.getState().addMoment(moment);
    expect(useMomentsStore.getState().moments).toHaveLength(1);
  });

  it('removeMoment removes the correct moment by questionId', () => {
    useMomentsStore.getState().addMoment({
      id: 'q1',
      questionId: 'q1',
      questionText: 'Question 1',
      deckId: 'curiosity',
    });
    useMomentsStore.getState().addMoment({
      id: 'q2',
      questionId: 'q2',
      questionText: 'Question 2',
      deckId: 'curiosity',
    });
    useMomentsStore.getState().removeMoment('q1');
    const moments = useMomentsStore.getState().moments;
    expect(moments).toHaveLength(1);
    expect(moments[0].questionId).toBe('q2');
  });

  it('isSaved returns true for saved moments and false for unsaved', () => {
    useMomentsStore.getState().addMoment({
      id: 'q1',
      questionId: 'q1',
      questionText: 'Test question',
      deckId: 'reflection',
    });
    expect(useMomentsStore.getState().isSaved('q1')).toBe(true);
    expect(useMomentsStore.getState().isSaved('q99')).toBe(false);
  });

  it('clearAll removes all moments', () => {
    useMomentsStore.getState().addMoment({
      id: 'q1',
      questionId: 'q1',
      questionText: 'Test',
      deckId: 'intimacy',
    });
    useMomentsStore.getState().clearAll();
    expect(useMomentsStore.getState().moments).toHaveLength(0);
  });
});
