# Onera v2 — Automation Test Suite

This directory contains the full regression test suite for Onera v2. It is self-contained and can be run locally without any external services, API keys, or a running device.

---

## Quick Start

```bash
# From the project root
pnpm install
pnpm test
```

To run with a live watch mode (re-runs on file change):

```bash
pnpm vitest
```

To run with a full HTML report:

```bash
pnpm test:report
```

The HTML report will open automatically at `coverage/index.html`.

---

## Test Structure

```
tests/
├── README.md                        ← This file
│
├── unit/                            ← Pure unit tests (no side effects)
│   ├── stores.session.test.ts       ← Session store: all methods, edge cases
│   └── stores.other.test.ts         ← Partners, Mood, Moments, Insights stores
│
├── integration/                     ← Tests that combine multiple modules
│   ├── navigation-guard.test.ts     ← StoreHydrator redirect logic
│   ├── session-flow.test.ts         ← Full session lifecycle + cross-store
│   └── data-contracts.test.ts       ← Question/deck schema validation
│
├── e2e/                             ← End-to-end user flow simulations
│   └── smoke.test.ts                ← 7 complete user flows (no UI)
│
├── ai-parsing.test.ts               ← AI weeklyInsight response parser
├── questions.test.ts                ← Question data and buildSession logic
├── stores.test.ts                   ← Legacy store tests (kept for history)
└── auth.logout.test.ts              ← Auth logout (skipped without server)
```

---

## Coverage Matrix

| Area | Tests | File |
|------|-------|------|
| Session store — startSession | 5 | unit/stores.session.test.ts |
| Session store — advanceQuestion | 5 | unit/stores.session.test.ts |
| Session store — switchTurn | 2 | unit/stores.session.test.ts |
| Session store — saveMoment/unsaveMoment | 3 | unit/stores.session.test.ts |
| Session store — endSession (incl. double-call guard) | 8 | unit/stores.session.test.ts |
| Session store — AI follow-up state | 3 | unit/stores.session.test.ts |
| Session store — reset | 1 | unit/stores.session.test.ts |
| Partners store | 9 | unit/stores.other.test.ts |
| Mood store | 8 | unit/stores.other.test.ts |
| Moments store | 7 | unit/stores.other.test.ts |
| Insights store | 6 | unit/stores.other.test.ts |
| Navigation guard logic | 12 | integration/navigation-guard.test.ts |
| Session lifecycle (full) | 5 | integration/session-flow.test.ts |
| Turn management | 2 | integration/session-flow.test.ts |
| Cross-store moments | 2 | integration/session-flow.test.ts |
| All decks produce valid sessions | 5 | integration/session-flow.test.ts |
| Partners + session integration | 2 | integration/session-flow.test.ts |
| DECKS schema | 5 | integration/data-contracts.test.ts |
| QUESTIONS schema | 6 | integration/data-contracts.test.ts |
| DAILY_QUESTIONS | 4 | integration/data-contracts.test.ts |
| getDecksForStage | 2 | integration/data-contracts.test.ts |
| buildSession | 8 | integration/data-contracts.test.ts |
| E2E: First-launch → setup → session | 1 | e2e/smoke.test.ts |
| E2E: Returning user → streak | 2 | e2e/smoke.test.ts |
| E2E: Reset flow | 2 | e2e/smoke.test.ts |
| E2E: Moments archive | 2 | e2e/smoke.test.ts |
| E2E: Insights flow | 2 | e2e/smoke.test.ts |
| E2E: Mood check-in | 3 | e2e/smoke.test.ts |
| E2E: Double-tap endSession guard | 1 | e2e/smoke.test.ts |
| AI weeklyInsight parser | 7 | ai-parsing.test.ts |
| Question deck data (legacy) | 13 | questions.test.ts |

**Total: ~130 tests**

---

## What Is NOT Tested Here

The following require a running device or server and must be tested manually:

| Area | Why Manual |
|------|-----------|
| Onboarding swipe animation | Requires React Native renderer |
| Continue button tap response | Requires native touch events |
| Session card swipe/long-press | Requires gesture handler |
| Haptic feedback | Requires physical device |
| Push notifications | Requires device + permissions |
| AI follow-up question generation | Requires live server + LLM |
| Couple pairing via invite code | Requires server + two devices |
| AsyncStorage persistence across app restarts | Requires device |

---

## Running Specific Test Files

```bash
# Run only unit tests
pnpm vitest run tests/unit

# Run only integration tests
pnpm vitest run tests/integration

# Run only E2E smoke tests
pnpm vitest run tests/e2e

# Run a single file
pnpm vitest run tests/e2e/smoke.test.ts

# Run tests matching a pattern
pnpm vitest run --reporter=verbose -t "endSession"
```

---

## Adding New Tests

1. Place unit tests in `tests/unit/`
2. Place integration tests in `tests/integration/`
3. Place E2E flow tests in `tests/e2e/`
4. Use `@/` path alias for all project imports (configured in `vitest.config.ts`)
5. Always mock `@react-native-async-storage/async-storage` in files that import stores
6. Reset all stores in `beforeEach` to prevent test pollution

### AsyncStorage Mock Template

```ts
import { vi } from 'vitest';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
  },
}));
```

---

## CI Integration

Add this to your CI pipeline (GitHub Actions, etc.):

```yaml
- name: Run Onera regression tests
  run: |
    cd onera
    pnpm install
    pnpm test
```

The test command exits with code `0` on success and `1` on failure, making it CI-compatible out of the box.
