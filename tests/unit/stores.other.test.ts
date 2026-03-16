/**
 * Onera v2 — Partners, Mood, Moments, and Insights Store Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePartnersStore } from '@/store/partners.store';
import type { PartnerProfile } from '@/store/partners.store';
import { useMoodStore, MOOD_META } from '@/store/mood.store';
import { useMomentsStore } from '@/store/moments.store';
import { useInsightsStore } from '@/store/insights.store';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
  },
}));

const PARTNER_A: PartnerProfile = { name: 'Alex', avatar: '🌸' };
const PARTNER_B: PartnerProfile = { name: 'Sam', avatar: '🌿' };

// ---------------------------------------------------------------------------
// Partners Store
// ---------------------------------------------------------------------------
describe('Partners Store', () => {
  beforeEach(() => usePartnersStore.getState().reset());

  it('starts with isSetupComplete = false', () => {
    expect(usePartnersStore.getState().isSetupComplete).toBe(false);
  });

  it('completeSetup sets all partner fields and marks setup complete', () => {
    usePartnersStore.getState().completeSetup(PARTNER_A, PARTNER_B, 'long-term');
    const s = usePartnersStore.getState();
    expect(s.partnerA.name).toBe('Alex');
    expect(s.partnerB.name).toBe('Sam');
    expect(s.relationshipStage).toBe('long-term');
    expect(s.isSetupComplete).toBe(true);
  });

  it('updatePartners updates names without changing stage', () => {
    usePartnersStore.getState().completeSetup(PARTNER_A, PARTNER_B, 'long-term');
    usePartnersStore.getState().updatePartners({ name: 'Jordan', avatar: '🌸' }, { name: 'Taylor', avatar: '🌿' });
    const s = usePartnersStore.getState();
    expect(s.partnerA.name).toBe('Jordan');
    expect(s.partnerB.name).toBe('Taylor');
    expect(s.relationshipStage).toBe('long-term');
  });

  it('updateStage changes the relationship stage', () => {
    usePartnersStore.getState().completeSetup(PARTNER_A, PARTNER_B, 'dating');
    usePartnersStore.getState().updateStage('long-term');
    expect(usePartnersStore.getState().relationshipStage).toBe('long-term');
  });

  it('markActiveToday sets lastActiveDate to today', () => {
    usePartnersStore.getState().completeSetup(PARTNER_A, PARTNER_B, 'dating');
    usePartnersStore.getState().markActiveToday();
    const today = new Date().toISOString().split('T')[0];
    expect(usePartnersStore.getState().lastActiveDate).toBe(today);
  });

  it('markActiveToday is idempotent — calling twice does not double-increment streak', () => {
    usePartnersStore.getState().completeSetup(PARTNER_A, PARTNER_B, 'dating');
    usePartnersStore.getState().markActiveToday();
    const streak1 = usePartnersStore.getState().streakCount;
    usePartnersStore.getState().markActiveToday();
    const streak2 = usePartnersStore.getState().streakCount;
    expect(streak1).toBe(streak2);
  });

  it('incrementStreak increases streakCount by 1', () => {
    usePartnersStore.getState().completeSetup(PARTNER_A, PARTNER_B, 'dating');
    usePartnersStore.getState().incrementStreak();
    expect(usePartnersStore.getState().streakCount).toBe(1);
  });

  it('setPremium sets the isPremium flag', () => {
    usePartnersStore.getState().setPremium(true);
    expect(usePartnersStore.getState().isPremium).toBe(true);
  });

  it('reset returns store to initial state', () => {
    usePartnersStore.getState().completeSetup(PARTNER_A, PARTNER_B, 'dating');
    usePartnersStore.getState().reset();
    expect(usePartnersStore.getState().isSetupComplete).toBe(false);
    expect(usePartnersStore.getState().partnerA.name).toBe('');
  });

  it('partnerA and partnerB have default empty names before setup', () => {
    const s = usePartnersStore.getState();
    expect(s.partnerA.name).toBe('');
    expect(s.partnerB.name).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Mood Store
// ---------------------------------------------------------------------------
describe('Mood Store', () => {
  beforeEach(() => useMoodStore.getState().reset());

  it('starts with myMood = null', () => {
    expect(useMoodStore.getState().myMood).toBeNull();
  });

  it('setMyMood stores the mood entry with correct fields', () => {
    useMoodStore.getState().setMyMood('calm', true);
    const mood = useMoodStore.getState().myMood;
    expect(mood).not.toBeNull();
    expect(mood!.mood).toBe('calm');
    expect(mood!.visibleToPartner).toBe(true);
    expect(mood!.id).toMatch(/^mood_/);
    expect(mood!.createdAt).toBeTruthy();
  });

  it('setMyMood appends to recentMoods (most recent first)', () => {
    useMoodStore.getState().setMyMood('grateful', false);
    useMoodStore.getState().setMyMood('playful', true);
    const moods = useMoodStore.getState().recentMoods;
    expect(moods).toHaveLength(2);
    expect(moods[0].mood).toBe('playful');
  });

  it('recentMoods is capped at 30 entries', () => {
    for (let i = 0; i < 35; i++) {
      useMoodStore.getState().setMyMood('calm', true);
    }
    expect(useMoodStore.getState().recentMoods.length).toBeLessThanOrEqual(30);
  });

  it('setPartnerMood stores the partner mood entry', () => {
    const entry = { id: 'p1', mood: 'tender' as const, visibleToPartner: true, createdAt: new Date().toISOString() };
    useMoodStore.getState().setPartnerMood(entry);
    expect(useMoodStore.getState().partnerMood).toEqual(entry);
  });

  it('reset clears myMood, partnerMood, and recentMoods', () => {
    useMoodStore.getState().setMyMood('anxious', false);
    useMoodStore.getState().reset();
    expect(useMoodStore.getState().myMood).toBeNull();
    expect(useMoodStore.getState().recentMoods).toHaveLength(0);
  });

  it('MOOD_META has entries for all 8 mood labels', () => {
    const labels = Object.keys(MOOD_META);
    expect(labels).toHaveLength(8);
    expect(labels).toContain('calm');
    expect(labels).toContain('tender');
    expect(labels).toContain('anxious');
    expect(labels).toContain('playful');
  });

  it('each MOOD_META entry has emoji, label, and a valid hex color', () => {
    for (const [, meta] of Object.entries(MOOD_META)) {
      expect(meta.emoji).toBeTruthy();
      expect(meta.label).toBeTruthy();
      expect(meta.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

// ---------------------------------------------------------------------------
// Moments Store
// ---------------------------------------------------------------------------
describe('Moments Store', () => {
  beforeEach(() => useMomentsStore.getState().clearAll());

  it('starts with empty moments array', () => {
    expect(useMomentsStore.getState().moments).toHaveLength(0);
  });

  it('addMoment adds a moment with a savedAt timestamp', () => {
    useMomentsStore.getState().addMoment({ id: 'q1', questionId: 'q1', questionText: 'Test?', deckId: 'curiosity' });
    const m = useMomentsStore.getState().moments[0];
    expect(m.questionId).toBe('q1');
    expect(m.savedAt).toBeGreaterThan(0);
  });

  it('addMoment is idempotent — duplicate questionId is ignored', () => {
    useMomentsStore.getState().addMoment({ id: 'q1', questionId: 'q1', questionText: 'Test?', deckId: 'curiosity' });
    useMomentsStore.getState().addMoment({ id: 'q1', questionId: 'q1', questionText: 'Test?', deckId: 'curiosity' });
    expect(useMomentsStore.getState().moments).toHaveLength(1);
  });

  it('removeMoment removes the correct entry by questionId', () => {
    useMomentsStore.getState().addMoment({ id: 'q1', questionId: 'q1', questionText: 'Q1', deckId: 'intimacy' });
    useMomentsStore.getState().addMoment({ id: 'q2', questionId: 'q2', questionText: 'Q2', deckId: 'intimacy' });
    useMomentsStore.getState().removeMoment('q1');
    const moments = useMomentsStore.getState().moments;
    expect(moments).toHaveLength(1);
    expect(moments[0].questionId).toBe('q2');
  });

  it('removeMoment on non-existent questionId is a no-op', () => {
    useMomentsStore.getState().addMoment({ id: 'q1', questionId: 'q1', questionText: 'Q1', deckId: 'reflection' });
    useMomentsStore.getState().removeMoment('does-not-exist');
    expect(useMomentsStore.getState().moments).toHaveLength(1);
  });

  it('isSaved returns true for saved and false for unsaved', () => {
    useMomentsStore.getState().addMoment({ id: 'q1', questionId: 'q1', questionText: 'Q1', deckId: 'reflection' });
    expect(useMomentsStore.getState().isSaved('q1')).toBe(true);
    expect(useMomentsStore.getState().isSaved('q99')).toBe(false);
  });

  it('clearAll empties the moments array', () => {
    useMomentsStore.getState().addMoment({ id: 'q1', questionId: 'q1', questionText: 'Q1', deckId: 'reflection' });
    useMomentsStore.getState().clearAll();
    expect(useMomentsStore.getState().moments).toHaveLength(0);
  });

  it('new moments are prepended (most recent first)', () => {
    useMomentsStore.getState().addMoment({ id: 'q1', questionId: 'q1', questionText: 'First', deckId: 'curiosity' });
    useMomentsStore.getState().addMoment({ id: 'q2', questionId: 'q2', questionText: 'Second', deckId: 'curiosity' });
    expect(useMomentsStore.getState().moments[0].questionId).toBe('q2');
  });
});

// ---------------------------------------------------------------------------
// Insights Store
// ---------------------------------------------------------------------------
describe('Insights Store', () => {
  beforeEach(() => useInsightsStore.getState().reset());

  it('starts with empty insights and null latestInsight', () => {
    expect(useInsightsStore.getState().insights).toHaveLength(0);
    expect(useInsightsStore.getState().latestInsight).toBeNull();
  });

  it('addInsight adds an entry and sets latestInsight', () => {
    const entry = { id: 'i1', insightType: 'weekly' as const, content: 'Great week', themes: ['connection'], generatedAt: new Date().toISOString() };
    useInsightsStore.getState().addInsight(entry);
    expect(useInsightsStore.getState().insights).toHaveLength(1);
    expect(useInsightsStore.getState().latestInsight?.id).toBe('i1');
  });

  it('addInsight prepends new entries (most recent first)', () => {
    const e1 = { id: 'i1', insightType: 'weekly' as const, content: 'Week 1', themes: [], generatedAt: '2026-01-01T00:00:00Z' };
    const e2 = { id: 'i2', insightType: 'weekly' as const, content: 'Week 2', themes: [], generatedAt: '2026-01-08T00:00:00Z' };
    useInsightsStore.getState().addInsight(e1);
    useInsightsStore.getState().addInsight(e2);
    expect(useInsightsStore.getState().insights[0].id).toBe('i2');
  });

  it('addInsight caps history at 12 entries', () => {
    for (let i = 0; i < 15; i++) {
      useInsightsStore.getState().addInsight({ id: `i${i}`, insightType: 'weekly', content: 'x', themes: [], generatedAt: new Date().toISOString() });
    }
    expect(useInsightsStore.getState().insights.length).toBeLessThanOrEqual(12);
  });

  it('setInsights sorts entries by generatedAt descending', () => {
    const entries = [
      { id: 'i1', insightType: 'weekly' as const, content: 'Old', themes: [], generatedAt: '2026-01-01T00:00:00Z' },
      { id: 'i2', insightType: 'weekly' as const, content: 'New', themes: [], generatedAt: '2026-03-01T00:00:00Z' },
    ];
    useInsightsStore.getState().setInsights(entries);
    expect(useInsightsStore.getState().insights[0].id).toBe('i2');
    expect(useInsightsStore.getState().latestInsight?.id).toBe('i2');
  });

  it('setGenerating toggles the isGenerating flag', () => {
    useInsightsStore.getState().setGenerating(true);
    expect(useInsightsStore.getState().isGenerating).toBe(true);
    useInsightsStore.getState().setGenerating(false);
    expect(useInsightsStore.getState().isGenerating).toBe(false);
  });

  it('reset clears all insights and latestInsight', () => {
    useInsightsStore.getState().addInsight({ id: 'i1', insightType: 'weekly', content: 'x', themes: [], generatedAt: new Date().toISOString() });
    useInsightsStore.getState().reset();
    expect(useInsightsStore.getState().insights).toHaveLength(0);
    expect(useInsightsStore.getState().latestInsight).toBeNull();
  });
});
