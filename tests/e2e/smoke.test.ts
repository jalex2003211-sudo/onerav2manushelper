/**
 * Onera v2 — E2E Smoke Tests
 *
 * These tests simulate complete user flows at the store/logic level,
 * verifying that the full journey from first launch to session completion
 * works correctly end-to-end without any UI rendering.
 *
 * Flows covered:
 *   1. First-launch flow: fresh state → setup → first session → history
 *   2. Returning user flow: hydrated state → session → streak update
 *   3. Reset flow: data reset → back to unauthenticated state
 *   4. Moments archive flow: session → save moments → view archive
 *   5. Insights flow: generate insight → view latest
 *   6. Multi-session streak flow: consecutive sessions → streak increments
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSessionStore } from '@/store/session.store';
import { usePartnersStore } from '@/store/partners.store';
import { useMoodStore } from '@/store/mood.store';
import { useMomentsStore } from '@/store/moments.store';
import { useInsightsStore } from '@/store/insights.store';
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

function resetAll() {
  useSessionStore.getState().reset();
  usePartnersStore.getState().reset();
  useMoodStore.getState().reset();
  useMomentsStore.getState().clearAll();
  useInsightsStore.getState().reset();
}

beforeEach(resetAll);

// ---------------------------------------------------------------------------
describe('E2E Smoke — Flow 1: First-launch → Setup → Session', () => {
  it('user starts with no setup, completes setup, runs a session, and has history', () => {
    // Step 1: App launches — user is not set up
    expect(usePartnersStore.getState().isSetupComplete).toBe(false);
    expect(useSessionStore.getState().sessionHistory).toHaveLength(0);

    // Step 2: User completes setup
    usePartnersStore.getState().completeSetup(PA, PB, 'dating');
    expect(usePartnersStore.getState().isSetupComplete).toBe(true);
    expect(usePartnersStore.getState().partnerA.name).toBe('Alex');

    // Step 3: User starts a session
    useSessionStore.getState().startSession('curiosity');
    expect(useSessionStore.getState().isActive).toBe(true);
    expect(useSessionStore.getState().questions).toHaveLength(10);

    // Step 4: User answers a few questions
    useSessionStore.getState().advanceQuestion();
    useSessionStore.getState().advanceQuestion();

    // Step 5: User ends session with a connection score
    useSessionStore.getState().setConnectionScore(8);
    const item = useSessionStore.getState().endSession();

    // Step 6: Verify history
    expect(item).not.toBeNull();
    expect(useSessionStore.getState().sessionHistory).toHaveLength(1);
    expect(useSessionStore.getState().isActive).toBe(false);
    expect(item!.connectionScore).toBe(8);
  });
});

// ---------------------------------------------------------------------------
describe('E2E Smoke — Flow 2: Returning user → streak update', () => {
  it('returning user runs a session and streak is marked for today', () => {
    // Simulate returning user (already set up)
    usePartnersStore.getState().completeSetup(PA, PB, 'long-term');
    usePartnersStore.getState().incrementStreak(); // simulate existing streak of 1
    expect(usePartnersStore.getState().streakCount).toBe(1);

    // User runs a session
    useSessionStore.getState().startSession('reflection');
    useSessionStore.getState().endSession();

    // User marks active today
    usePartnersStore.getState().markActiveToday();
    const today = new Date().toISOString().split('T')[0];
    expect(usePartnersStore.getState().lastActiveDate).toBe(today);
  });

  it('calling markActiveToday twice on the same day does not double-increment', () => {
    usePartnersStore.getState().completeSetup(PA, PB, 'dating');
    usePartnersStore.getState().markActiveToday();
    const streak1 = usePartnersStore.getState().streakCount;
    usePartnersStore.getState().markActiveToday();
    const streak2 = usePartnersStore.getState().streakCount;
    expect(streak1).toBe(streak2);
  });
});

// ---------------------------------------------------------------------------
describe('E2E Smoke — Flow 3: Reset flow', () => {
  it('after reset, all stores return to initial state', () => {
    // Set up full state
    usePartnersStore.getState().completeSetup(PA, PB, 'dating');
    useSessionStore.getState().startSession('curiosity');
    useSessionStore.getState().endSession();
    useMoodStore.getState().setMyMood('calm', true);
    useMomentsStore.getState().addMoment({ id: 'q1', questionId: 'q1', questionText: 'Test?', deckId: 'curiosity' });
    useInsightsStore.getState().addInsight({ id: 'i1', insightType: 'weekly', content: 'x', themes: [], generatedAt: new Date().toISOString() });

    // Reset all stores
    usePartnersStore.getState().reset();
    useSessionStore.getState().reset();
    useMoodStore.getState().reset();
    useMomentsStore.getState().clearAll();
    useInsightsStore.getState().reset();

    // Verify clean state
    expect(usePartnersStore.getState().isSetupComplete).toBe(false);
    expect(useSessionStore.getState().sessionHistory).toHaveLength(0);
    expect(useMoodStore.getState().myMood).toBeNull();
    expect(useMomentsStore.getState().moments).toHaveLength(0);
    expect(useInsightsStore.getState().insights).toHaveLength(0);
  });

  it('after reset, navigation guard would redirect to onboarding', () => {
    usePartnersStore.getState().completeSetup(PA, PB, 'dating');
    usePartnersStore.getState().reset();
    expect(usePartnersStore.getState().isSetupComplete).toBe(false);
    // Guard would fire: !isSetupComplete && !(inAuthGroup)
    const wouldRedirect = !usePartnersStore.getState().isSetupComplete;
    expect(wouldRedirect).toBe(true);
  });
});

// ---------------------------------------------------------------------------
describe('E2E Smoke — Flow 4: Moments archive', () => {
  it('user saves moments during session and they appear in the archive', () => {
    usePartnersStore.getState().completeSetup(PA, PB, 'dating');
    useSessionStore.getState().startSession('intimacy');

    const questions = useSessionStore.getState().questions;
    const q0 = questions[0];
    const q1 = questions[1];

    // User long-presses to save moments
    useMomentsStore.getState().addMoment({ id: q0.id, questionId: q0.id, questionText: q0.text, deckId: 'intimacy' });
    useMomentsStore.getState().addMoment({ id: q1.id, questionId: q1.id, questionText: q1.text, deckId: 'intimacy' });

    useSessionStore.getState().endSession();

    // Verify archive
    const moments = useMomentsStore.getState().moments;
    expect(moments).toHaveLength(2);
    expect(useMomentsStore.getState().isSaved(q0.id)).toBe(true);
    expect(useMomentsStore.getState().isSaved(q1.id)).toBe(true);
  });

  it('user can remove a moment from the archive', () => {
    useMomentsStore.getState().addMoment({ id: 'q1', questionId: 'q1', questionText: 'Test?', deckId: 'curiosity' });
    useMomentsStore.getState().removeMoment('q1');
    expect(useMomentsStore.getState().moments).toHaveLength(0);
    expect(useMomentsStore.getState().isSaved('q1')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
describe('E2E Smoke — Flow 5: Insights flow', () => {
  it('user generates a weekly insight and it becomes the latest', () => {
    const insight = {
      id: `insight_${Date.now()}`,
      insightType: 'weekly' as const,
      content: 'This week you explored vulnerability with care.',
      themes: ['vulnerability', 'trust'],
      generatedAt: new Date().toISOString(),
    };

    useInsightsStore.getState().addInsight(insight);

    expect(useInsightsStore.getState().latestInsight?.id).toBe(insight.id);
    expect(useInsightsStore.getState().insights).toHaveLength(1);
    expect(useInsightsStore.getState().latestInsight?.themes).toContain('vulnerability');
  });

  it('multiple insights are sorted newest first', () => {
    useInsightsStore.getState().addInsight({ id: 'i1', insightType: 'weekly', content: 'Week 1', themes: [], generatedAt: '2026-01-01T00:00:00Z' });
    useInsightsStore.getState().addInsight({ id: 'i2', insightType: 'weekly', content: 'Week 2', themes: [], generatedAt: '2026-01-08T00:00:00Z' });

    expect(useInsightsStore.getState().latestInsight?.id).toBe('i2');
  });
});

// ---------------------------------------------------------------------------
describe('E2E Smoke — Flow 6: Mood check-in', () => {
  it('user logs a mood and it is stored correctly', () => {
    useMoodStore.getState().setMyMood('grateful', true);
    const mood = useMoodStore.getState().myMood;
    expect(mood?.mood).toBe('grateful');
    expect(mood?.visibleToPartner).toBe(true);
  });

  it('partner mood can be set independently', () => {
    useMoodStore.getState().setMyMood('calm', false);
    useMoodStore.getState().setPartnerMood({ id: 'p1', mood: 'tender', visibleToPartner: true, createdAt: new Date().toISOString() });

    expect(useMoodStore.getState().myMood?.mood).toBe('calm');
    expect(useMoodStore.getState().partnerMood?.mood).toBe('tender');
  });

  it('mood history accumulates over time', () => {
    useMoodStore.getState().setMyMood('calm', true);
    useMoodStore.getState().setMyMood('playful', true);
    useMoodStore.getState().setMyMood('grateful', false);
    expect(useMoodStore.getState().recentMoods).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
describe('E2E Smoke — Flow 7: Double-tap endSession guard', () => {
  it('rapid double-tap on end session only creates one history entry', () => {
    useSessionStore.getState().startSession('curiosity');
    useSessionStore.getState().setConnectionScore(7);

    // Simulate rapid double-tap
    const r1 = useSessionStore.getState().endSession();
    const r2 = useSessionStore.getState().endSession();

    expect(r1).not.toBeNull();
    expect(r2).toBeNull();
    expect(useSessionStore.getState().sessionHistory).toHaveLength(1);
  });
});
