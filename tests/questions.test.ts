import { describe, it, expect } from 'vitest';
import {
  DECKS,
  QUESTIONS,
  DAILY_QUESTIONS,
  getDailyQuestion,
  getDecksForStage,
  buildSession,
} from '../lib/data/questions';

describe('Question Deck Data', () => {
  it('has 5 decks', () => {
    expect(DECKS).toHaveLength(5);
  });

  it('has at least 40 questions', () => {
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(40);
  });

  it('every question has required fields', () => {
    for (const q of QUESTIONS) {
      expect(q.id).toBeTruthy();
      expect(q.text).toBeTruthy();
      expect(['break-the-ice', 'curiosity', 'deep-connection', 'intimacy', 'reflection']).toContain(q.deck);
      expect(['warmup', 'explore', 'deep', 'reflection']).toContain(q.phase);
    }
  });

  it('question IDs are unique', () => {
    const ids = QUESTIONS.map(q => q.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('has daily questions', () => {
    expect(DAILY_QUESTIONS.length).toBeGreaterThan(0);
  });

  it('getDailyQuestion returns a string', () => {
    const q = getDailyQuestion();
    expect(typeof q).toBe('string');
    expect(q.length).toBeGreaterThan(0);
  });
});

describe('getDecksForStage', () => {
  it('returns decks for break-the-ice stage', () => {
    const decks = getDecksForStage('break-the-ice');
    expect(decks.length).toBeGreaterThan(0);
    expect(decks.every(d => d.recommendedFor.includes('break-the-ice'))).toBe(true);
  });

  it('returns decks for dating stage', () => {
    const decks = getDecksForStage('dating');
    expect(decks.length).toBeGreaterThan(0);
  });

  it('returns decks for long-term stage', () => {
    const decks = getDecksForStage('long-term');
    expect(decks.length).toBeGreaterThan(0);
  });
});

describe('buildSession', () => {
  it('builds a session with correct count', () => {
    const session = buildSession('deep-connection', 10);
    expect(session.length).toBe(10);
  });

  it('builds a session with questions from the correct deck', () => {
    const session = buildSession('curiosity', 8);
    expect(session.every(q => q.deck === 'curiosity')).toBe(true);
  });

  it('session includes questions from multiple phases', () => {
    const session = buildSession('reflection', 10);
    const phases = new Set(session.map(q => q.phase));
    expect(phases.size).toBeGreaterThan(1);
  });

  it('session starts with warmup phase questions', () => {
    const session = buildSession('deep-connection', 10);
    expect(session[0].phase).toBe('warmup');
  });
});
