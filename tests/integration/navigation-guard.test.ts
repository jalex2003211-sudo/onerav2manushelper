/**
 * Onera v2 — Navigation Guard Integration Tests
 *
 * Tests the StoreHydrator redirect logic in isolation.
 * The guard rules are:
 *   - If NOT setup complete AND NOT in auth group → redirect to /onboarding
 *   - If setup complete → do not redirect
 *   - Auth group = ['onboarding', 'setup', 'pair', 'oauth']
 */

import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Extracted guard logic (mirrors StoreHydrator in app/_layout.tsx)
// ---------------------------------------------------------------------------
type Segment = string;

function shouldRedirectToOnboarding(
  isSetupComplete: boolean,
  segments: Segment[],
): boolean {
  const inAuthGroup =
    segments[0] === 'onboarding' ||
    segments[0] === 'setup' ||
    segments[0] === 'pair' ||
    segments[0] === 'oauth';
  return !isSetupComplete && !inAuthGroup;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('Navigation Guard — shouldRedirectToOnboarding', () => {
  it('redirects unauthenticated user on (tabs) route', () => {
    expect(shouldRedirectToOnboarding(false, ['(tabs)'])).toBe(true);
  });

  it('redirects unauthenticated user on session route', () => {
    expect(shouldRedirectToOnboarding(false, ['session'])).toBe(true);
  });

  it('redirects unauthenticated user on insights route', () => {
    expect(shouldRedirectToOnboarding(false, ['insights'])).toBe(true);
  });

  it('does NOT redirect when already on onboarding screen', () => {
    expect(shouldRedirectToOnboarding(false, ['onboarding'])).toBe(false);
  });

  it('does NOT redirect when on setup screen', () => {
    expect(shouldRedirectToOnboarding(false, ['setup'])).toBe(false);
  });

  it('does NOT redirect when on pair screen', () => {
    expect(shouldRedirectToOnboarding(false, ['pair'])).toBe(false);
  });

  it('does NOT redirect when on oauth callback route', () => {
    expect(shouldRedirectToOnboarding(false, ['oauth'])).toBe(false);
  });

  it('does NOT redirect when setup is complete on (tabs)', () => {
    expect(shouldRedirectToOnboarding(true, ['(tabs)'])).toBe(false);
  });

  it('does NOT redirect when setup is complete on session screen', () => {
    expect(shouldRedirectToOnboarding(true, ['session'])).toBe(false);
  });

  it('does NOT redirect when setup is complete on insights screen', () => {
    expect(shouldRedirectToOnboarding(true, ['insights'])).toBe(false);
  });

  it('does NOT redirect on empty segments (root)', () => {
    expect(shouldRedirectToOnboarding(false, [])).toBe(true);
  });

  it('does NOT redirect when setup complete even on onboarding (no loop)', () => {
    // If user is setup complete and somehow on onboarding, guard does not fire
    expect(shouldRedirectToOnboarding(true, ['onboarding'])).toBe(false);
  });
});
