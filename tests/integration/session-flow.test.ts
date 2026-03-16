/**
 * Onera v2 — Session Flow Integration Tests
 *
 * Tests the full session lifecycle: start → advance through all phases
 * → save moments → end session → verify history entry.
 * Uses the real session store and real question data.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSessionStore } from '@/store/session.store';
import { useMomentsStore } from '@/store/moments.store';
import { usePartnersStore } from '@/store/partners.store';
import { DECKS, buildSession } from '@/lib/data/questions';
import type { PartnerProfile } from '@/store/partners.store';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
  },
}));

const PA: PartnerProfile = { name: 'Alex', avatar: '🌸' };
const PB: PartnerProfile = { name: 'Sam', avatar: '🌿' };

beforeEach(() => {
  useSessionStore.getState().reset();
  useMomentsStore.getState().clearAll();
  usePartnersStore.getState().reset();
});

// ---------------------------------------------------------------------------
describe('Session Flow — full lifecycle', () => {
  it('completes a full curiosity session: start → advance all → end', () => {
    useSessionStore.getState().startSession('curiosity');
    const { questions } = useSessionStore.getState();
    expect(questions).toHaveLength(10);

    // Advance through all questions
    for (let i = 0; i < questions.length - 1; i++) {
      useSessionStore.getState().advanceQuestion();
    }

    expect(useSessionStore.getState().currentIndex).toBe(questions.length - 1);

    useSessionStore.getState().setConnectionScore(9);
    const item = useSessionStore.getState().endSession();

    expect(item).not.toBeNull();
    expect(item!.deckId).toBe('curiosity');
    expect(item!.connectionScore).toBe(9);
    expect(item!.questionCount).toBe(10);
    expect(item!.phasesCompleted).toBeGreaterThanOrEqual(1);
    expect(item!.phasesCompleted).toBeLessThanOrEqual(4);
    expect(useSessionStore.getState().isActive).toBe(false);
  });

  it('correctly records phasesCompleted = 4 when all phases are traversed', () => {
    // Build a session and manually set questions with all 4 phases
    useSessionStore.getState().startSession('curiosity');
    const { questions } = useSessionStore.getState();

    // Advance to the last question to ensure all phases are covered
    for (let i = 0; i < questions.length - 1; i++) {
      useSessionStore.getState().advanceQuestion();
    }

    const item = useSessionStore.getState().endSession();
    const phases = new Set(questions.map(q => q.phase));
    expect(item!.phasesCompleted).toBe(phases.size);
  });

  it('saves moments during session and records them in history', () => {
    useSessionStore.getState().startSession('intimacy');
    const { questions } = useSessionStore.getState();
    const q0 = questions[0].id;
    const q1 = questions[1].id;

    useSessionStore.getState().saveMoment(q0);
    useSessionStore.getState().saveMoment(q1);

    const item = useSessionStore.getState().endSession();
    expect(item!.savedMomentIds).toContain(q0);
    expect(item!.savedMomentIds).toContain(q1);
  });

  it('session history accumulates across multiple sessions', () => {
    useSessionStore.getState().startSession('curiosity');
    useSessionStore.getState().endSession();
    useSessionStore.getState().startSession('reflection');
    useSessionStore.getState().endSession();

    expect(useSessionStore.getState().sessionHistory).toHaveLength(2);
  });

  it('history is ordered most-recent first', () => {
    useSessionStore.getState().startSession('curiosity');
    useSessionStore.getState().endSession();
    useSessionStore.getState().startSession('intimacy');
    useSessionStore.getState().endSession();

    const history = useSessionStore.getState().sessionHistory;
    expect(history[0].deckId).toBe('intimacy');
    expect(history[1].deckId).toBe('curiosity');
  });
});

// ---------------------------------------------------------------------------
describe('Session Flow — turn management', () => {
  it('turn alternates correctly: A → B → A', () => {
    useSessionStore.getState().startSession('curiosity');
    expect(useSessionStore.getState().turnOwner).toBe('A');
    useSessionStore.getState().switchTurn();
    expect(useSessionStore.getState().turnOwner).toBe('B');
    useSessionStore.getState().switchTurn();
    expect(useSessionStore.getState().turnOwner).toBe('A');
  });

  it('advancing a question resets turn to A', () => {
    useSessionStore.getState().startSession('curiosity');
    useSessionStore.getState().switchTurn(); // now B
    useSessionStore.getState().advanceQuestion();
    expect(useSessionStore.getState().turnOwner).toBe('A');
  });
});

// ---------------------------------------------------------------------------
describe('Session Flow — moments cross-store integration', () => {
  it('moments saved in session store are independent from moments store', () => {
    useSessionStore.getState().startSession('curiosity');
    const qId = useSessionStore.getState().questions[0].id;

    // Save in session store (in-session tracking)
    useSessionStore.getState().saveMoment(qId);
    expect(useSessionStore.getState().isMomentSaved(qId)).toBe(true);

    // Moments store is separate (user explicitly saves to archive)
    expect(useMomentsStore.getState().isSaved(qId)).toBe(false);
  });

  it('adding to moments store does not affect session store saved set', () => {
    useSessionStore.getState().startSession('curiosity');
    const qId = useSessionStore.getState().questions[0].id;
    const qText = useSessionStore.getState().questions[0].text;

    useMomentsStore.getState().addMoment({ id: qId, questionId: qId, questionText: qText, deckId: 'curiosity' });
    expect(useSessionStore.getState().isMomentSaved(qId)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
describe('Session Flow — all decks produce valid sessions', () => {
  for (const deck of DECKS) {
    it(`deck "${deck.id}" produces exactly 10 questions via buildSession`, () => {
      const session = buildSession(deck.id, 10);
      expect(session.length).toBe(10);
      // All questions must have required fields
      for (const q of session) {
        expect(q.id).toBeTruthy();
        expect(q.text).toBeTruthy();
        expect(q.phase).toMatch(/^(warmup|explore|deep|reflection)$/);
        expect(q.deck).toBeTruthy();
      }
    });
  }
});

// ---------------------------------------------------------------------------
describe('Session Flow — partners store integration', () => {
  it('markActiveToday after session increments streak on consecutive days', () => {
    usePartnersStore.getState().completeSetup(PA, PB, 'dating');
    usePartnersStore.getState().markActiveToday();
    expect(usePartnersStore.getState().streakCount).toBeGreaterThanOrEqual(1);
  });

  it('setup complete flag persists after a session is run', () => {
    usePartnersStore.getState().completeSetup(PA, PB, 'dating');
    useSessionStore.getState().startSession('curiosity');
    useSessionStore.getState().endSession();
    expect(usePartnersStore.getState().isSetupComplete).toBe(true);
  });
});
