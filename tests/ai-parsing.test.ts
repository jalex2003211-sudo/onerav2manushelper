/**
 * Onera v2 — AI Router Response Parsing Tests (FIX-L1)
 *
 * Tests the regex parsing logic used in the weeklyInsight procedure
 * to extract INSIGHT and THEMES from the LLM response.
 * These are pure functions extracted from the router for testability.
 */

import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Parsing logic extracted from ai.router.ts weeklyInsight procedure
// ---------------------------------------------------------------------------

function parseWeeklyInsight(text: string): { insight: string; themes: string[] } {
  const insightMatch = text.match(/INSIGHT:\s*(.+?)(?=THEMES:|$)/s);
  const themesMatch = text.match(/THEMES:\s*(.+)/);

  const insight = insightMatch?.[1]?.trim() ?? text.trim();
  const themes = themesMatch?.[1]?.split(',').map((t: string) => t.trim()).filter(Boolean) ?? [];

  return { insight, themes };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AI weeklyInsight response parsing', () => {
  it('parses a well-formed INSIGHT + THEMES response correctly', () => {
    const raw = `INSIGHT: This week you both carved out time for each other despite busy schedules. Alex and Sam, your consistency is quietly building something lasting. The questions you explored touched on gratitude and curiosity — two qualities that keep relationships fresh. Keep showing up like this.
THEMES: gratitude, curiosity, consistency`;

    const { insight, themes } = parseWeeklyInsight(raw);

    expect(insight).toContain('Alex and Sam');
    expect(insight).toContain('gratitude and curiosity');
    expect(themes).toEqual(['gratitude', 'curiosity', 'consistency']);
  });

  it('falls back to the full text as insight when INSIGHT: prefix is missing', () => {
    const raw = `You both had a meaningful week of connection. Keep going.`;
    const { insight, themes } = parseWeeklyInsight(raw);
    expect(insight).toBe('You both had a meaningful week of connection. Keep going.');
    expect(themes).toEqual([]);
  });

  it('returns empty themes array when THEMES: section is missing', () => {
    const raw = `INSIGHT: You explored vulnerability this week with care and warmth.`;
    const { insight, themes } = parseWeeklyInsight(raw);
    expect(insight).toBe('You explored vulnerability this week with care and warmth.');
    expect(themes).toEqual([]);
  });

  it('trims whitespace from insight and each theme', () => {
    const raw = `INSIGHT:   Lots of space around this insight.   \nTHEMES:  vulnerability ,  trust ,  openness  `;
    const { insight, themes } = parseWeeklyInsight(raw);
    expect(insight).toBe('Lots of space around this insight.');
    expect(themes).toEqual(['vulnerability', 'trust', 'openness']);
  });

  it('handles multi-line insight text correctly', () => {
    const raw = `INSIGHT: Line one of the insight.
Line two continues here.
Line three wraps up.
THEMES: connection, warmth`;

    const { insight, themes } = parseWeeklyInsight(raw);
    expect(insight).toContain('Line one');
    expect(insight).toContain('Line three');
    expect(themes).toEqual(['connection', 'warmth']);
  });

  it('handles a single theme without a trailing comma', () => {
    const raw = `INSIGHT: A short insight.
THEMES: vulnerability`;
    const { themes } = parseWeeklyInsight(raw);
    expect(themes).toEqual(['vulnerability']);
  });

  it('filters out empty strings from themes list', () => {
    const raw = `INSIGHT: Test.
THEMES: gratitude, , curiosity, `;
    const { themes } = parseWeeklyInsight(raw);
    expect(themes).toEqual(['gratitude', 'curiosity']);
  });
});
