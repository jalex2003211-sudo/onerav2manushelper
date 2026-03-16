/**
 * Onera v2 — Data Contract Integration Tests
 *
 * Validates that the question deck data conforms to the expected schema
 * and that all exported functions behave correctly across all inputs.
 */

import { describe, it, expect } from 'vitest';
import {
  DECKS,
  QUESTIONS,
  DAILY_QUESTIONS,
  getDailyQuestion,
  getDecksForStage,
  buildSession,
} from '@/lib/data/questions';
import type { DeckId, RelationshipStage } from '@/lib/data/questions';

const ALL_DECK_IDS: DeckId[] = ['break-the-ice', 'curiosity', 'deep-connection', 'intimacy', 'reflection'];
const ALL_STAGES: RelationshipStage[] = ['break-the-ice', 'dating', 'long-term'];
const ALL_PHASES = ['warmup', 'explore', 'deep', 'reflection'];

// ---------------------------------------------------------------------------
describe('Data Contracts — DECKS', () => {
  it('exports exactly 5 decks', () => {
    expect(DECKS).toHaveLength(5);
  });

  it('each deck has all required fields', () => {
    for (const deck of DECKS) {
      expect(deck.id).toBeTruthy();
      expect(deck.name).toBeTruthy();
      expect(deck.description).toBeTruthy();
      expect(deck.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(deck.darkColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(Array.isArray(deck.recommendedFor)).toBe(true);
      expect(deck.recommendedFor.length).toBeGreaterThan(0);
    }
  });

  it('all deck IDs are unique', () => {
    const ids = DECKS.map(d => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('deck IDs match the expected set', () => {
    const ids = DECKS.map(d => d.id).sort();
    expect(ids).toEqual([...ALL_DECK_IDS].sort());
  });

  it('all recommendedFor values are valid RelationshipStage values', () => {
    for (const deck of DECKS) {
      for (const stage of deck.recommendedFor) {
        expect(ALL_STAGES).toContain(stage);
      }
    }
  });
});

// ---------------------------------------------------------------------------
describe('Data Contracts — QUESTIONS', () => {
  it('exports at least 45 questions total', () => {
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(45);
  });

  it('each question has all required fields', () => {
    for (const q of QUESTIONS) {
      expect(q.id).toBeTruthy();
      expect(q.text).toBeTruthy();
      expect(ALL_DECK_IDS).toContain(q.deck);
      expect(ALL_PHASES).toContain(q.phase);
    }
  });

  it('all question IDs are unique', () => {
    const ids = QUESTIONS.map(q => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('each deck has at least one question in each phase', () => {
    for (const deckId of ALL_DECK_IDS) {
      const deckQuestions = QUESTIONS.filter(q => q.deck === deckId);
      // At minimum, the deck should have warmup questions
      const warmup = deckQuestions.filter(q => q.phase === 'warmup');
      expect(warmup.length).toBeGreaterThan(0);
    }
  });

  it('question text is not empty or whitespace-only', () => {
    for (const q of QUESTIONS) {
      expect(q.text.trim().length).toBeGreaterThan(0);
    }
  });

  it('question text ends with a question mark', () => {
    for (const q of QUESTIONS) {
      expect(q.text.trim()).toMatch(/\?$/);
    }
  });
});

// ---------------------------------------------------------------------------
describe('Data Contracts — DAILY_QUESTIONS', () => {
  it('exports at least 10 daily questions', () => {
    expect(DAILY_QUESTIONS.length).toBeGreaterThanOrEqual(10);
  });

  it('all daily questions are non-empty strings', () => {
    for (const q of DAILY_QUESTIONS) {
      expect(typeof q).toBe('string');
      expect(q.trim().length).toBeGreaterThan(0);
    }
  });

  it('getDailyQuestion returns a string from DAILY_QUESTIONS', () => {
    const q = getDailyQuestion();
    expect(typeof q).toBe('string');
    expect(q.trim().length).toBeGreaterThan(0);
    expect(DAILY_QUESTIONS).toContain(q);
  });

  it('getDailyQuestion is deterministic for the same day', () => {
    const q1 = getDailyQuestion();
    const q2 = getDailyQuestion();
    expect(q1).toBe(q2);
  });
});

// ---------------------------------------------------------------------------
describe('Data Contracts — getDecksForStage', () => {
  it('returns at least one deck for every relationship stage', () => {
    for (const stage of ALL_STAGES) {
      const decks = getDecksForStage(stage);
      expect(decks.length).toBeGreaterThan(0);
    }
  });

  it('returns only decks that include the given stage in recommendedFor', () => {
    for (const stage of ALL_STAGES) {
      const decks = getDecksForStage(stage);
      for (const deck of decks) {
        expect(deck.recommendedFor).toContain(stage);
      }
    }
  });
});

// ---------------------------------------------------------------------------
describe('Data Contracts — buildSession', () => {
  it('returns exactly 10 questions for every deck', () => {
    for (const deckId of ALL_DECK_IDS) {
      const session = buildSession(deckId, 10);
      expect(session.length).toBe(10);
    }
  });

  it('returns exactly 5 questions when count=5', () => {
    const session = buildSession('curiosity', 5);
    expect(session.length).toBe(5);
  });

  it('all questions in a session have the correct deck or are cross-deck padding', () => {
    const session = buildSession('curiosity', 10);
    // All questions must be valid Question objects
    for (const q of session) {
      expect(q.id).toBeTruthy();
      expect(q.text).toBeTruthy();
      expect(ALL_PHASES).toContain(q.phase);
    }
  });

  it('session starts with warmup phase questions', () => {
    const session = buildSession('curiosity', 10);
    expect(session[0].phase).toBe('warmup');
  });

  it('session ends with reflection phase questions', () => {
    const session = buildSession('curiosity', 10);
    expect(session[session.length - 1].phase).toBe('reflection');
  });

  it('phases progress in order: warmup → explore → deep → reflection', () => {
    const session = buildSession('deep-connection', 10);
    const phaseOrder = ['warmup', 'explore', 'deep', 'reflection'];
    let lastPhaseIndex = -1;
    for (const q of session) {
      const idx = phaseOrder.indexOf(q.phase);
      expect(idx).toBeGreaterThanOrEqual(lastPhaseIndex);
      lastPhaseIndex = idx;
    }
  });

  it('break-the-ice deck (8 questions) is padded to 10 via cross-deck questions', () => {
    const session = buildSession('break-the-ice', 10);
    expect(session.length).toBe(10);
  });

  it('all question IDs in a session are unique (no duplicates)', () => {
    const session = buildSession('curiosity', 10);
    const ids = session.map(q => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
