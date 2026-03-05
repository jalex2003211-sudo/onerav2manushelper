# Onera — Design Document

## Overview

Onera is a premium two-player mobile experience designed to help couples or partners connect emotionally through guided conversations. The app should feel **slow, thoughtful, and intimate** — like a shared ritual rather than a game.

---

## Brand Identity

- **Name:** Onera
- **Tagline:** "Where connection unfolds."
- **Tone:** Calm, premium, intentional, emotionally safe
- **Anti-patterns:** Bright colors, gamification, noisy UI, aggressive CTAs

---

## Color Palette

| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| `background` | `#FAF7F4` | `#1A1614` | Warm off-white / deep warm black |
| `surface` | `#F0EBE5` | `#2A2320` | Card and elevated surfaces |
| `foreground` | `#2C1F1A` | `#F0EBE5` | Primary text |
| `muted` | `#9C8880` | `#7A6A64` | Secondary text |
| `primary` | `#C4856A` | `#D4957A` | Warm terracotta accent |
| `border` | `#E0D8D2` | `#3A2E2A` | Subtle dividers |
| `accent` | `#8B7355` | `#A08060` | Deep warm gold for phase indicators |

---

## Typography

- **Display:** Large serif-feel headings (system font, bold) — 32–40px
- **Title:** Medium weight — 20–24px
- **Body:** Regular weight, generous line height (1.6x) — 16px
- **Caption:** Muted, small — 13–14px
- **Spacing:** Generous padding (24px+), comfortable breathing room

---

## Screen List

1. **Splash / Welcome Screen** — Onera logo, tagline, "Begin" CTA
2. **Partner Setup Screen** — Enter names for Partner A and Partner B, optional emoji avatar
3. **Relationship Stage Screen** — Choose: Break the Ice / Dating / Long-Term
4. **Home Screen (Dashboard)** — Greeting, Daily Question card, Start Session CTA, Shared Moments preview
5. **Session Start Screen** — Deck selection, brief session intro
6. **Session Screen** — Active card-based conversation with phase indicator and turn guidance
7. **Session End Screen** — Summary (questions answered), connection slider, appreciation note
8. **Shared Moments Screen** — Archive of saved/favorited questions
9. **Settings Screen** — Edit partner names, relationship stage, reset data

---

## Key User Flows

### Flow 1: First-Time Setup
1. Splash screen → tap "Begin"
2. Partner Setup → enter names, choose emoji avatars → tap "Continue"
3. Relationship Stage → choose stage → tap "Let's Begin"
4. Home screen

### Flow 2: Start a Session
1. Home screen → tap "Start a Session"
2. Session Start → choose deck (or auto-select by stage) → tap "Begin Session"
3. Session screen → tap card to reveal question
4. Turn indicator shows whose turn it is → answer → tap "Next"
5. Long-press card to save to Shared Moments
6. Swipe right to advance
7. After all questions → Session End screen
8. Adjust connection slider → tap "Close Session"
9. Return to Home

### Flow 3: Daily Question
1. Home screen → tap Daily Question card
2. Full-screen card view with today's question
3. Turn-based answering → tap "Done"
4. Return to Home

### Flow 4: View Shared Moments
1. Home screen → tap "Shared Moments" or navigate via tab
2. Browse saved questions as cards
3. Tap to expand / view full question

---

## Component Design

### Question Card
- Rounded corners (24px radius)
- Soft shadow
- Phase color indicator (top strip or subtle tint)
- Question text centered, generous padding
- Tap to reveal (flip animation)
- Swipe right to advance, long-press to save

### Phase Indicator
- Horizontal progress dots or soft gradient bar
- Phase label: "Warm Up", "Explore", "Deep", "Reflection"
- Color shifts subtly per phase

### Turn Indicator
- Soft banner at bottom: "It's [Name]'s turn"
- Partner avatar/emoji + name
- Gentle fade transition between turns

### Session End Card
- Warm congratulatory message
- Questions answered count
- Slider: "How connected do you feel right now?" (1–10)
- "Close Session" button

---

## Navigation Structure

```
(tabs)/
  index         → Home
  moments       → Shared Moments
  settings      → Settings

(modal)/
  setup         → Partner Setup (first launch)
  stage         → Relationship Stage (first launch)
  session-start → Deck selection
  session       → Active session
  session-end   → Session summary
  daily         → Daily question
```

---

## Animation Guidelines

- Card reveal: gentle flip or fade-in (250ms)
- Card swipe: natural gesture-driven translation
- Phase transition: soft cross-fade (300ms)
- Turn change: slide-up banner (200ms)
- All transitions: `withTiming`, easing `Easing.out(Easing.quad)`
- No bouncy springs, no dramatic scales
