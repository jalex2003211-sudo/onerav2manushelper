# Onera — Project TODO

## Setup & Configuration
- [x] Configure warm color theme (terracotta, warm off-white)
- [x] Generate app logo (warm, minimal, intimate)
- [x] Update app.config.ts with branding

## Data Layer
- [x] Create question deck data (5 decks, 60+ questions)
- [x] Create session engine logic (phase progression, turn switching)
- [x] Create app state context (partners, stage, sessions, favorites)
- [x] AsyncStorage persistence for state

## Screens (V1)
- [x] Splash / Welcome screen (handled by setup flow)
- [x] Partner Setup screen (names + emoji avatars)
- [x] Relationship Stage selection screen (part of setup flow)
- [x] Home screen (dashboard with daily question + session CTA)
- [x] Session Start screen (deck selection)
- [x] Session screen (card-based interaction, phase indicator, turn guide)
- [x] Session End screen (summary + connection slider)
- [x] Shared Moments screen (saved questions archive)
- [x] Settings screen (edit partners, stage, reset)

## Features (V1)
- [x] Card tap-to-reveal interaction
- [x] Card tap-to-advance (with animation)
- [x] Long-press to save to Shared Moments
- [x] Turn-based answering indicator
- [x] Phase transitions (Warm Up → Explore → Deep → Reflection)
- [x] Daily Question feature
- [x] Connection slider on session end
- [x] Tab navigation (Home, Shared Moments, Settings)

## Polish (V1)
- [x] Smooth card animations (fade + slide)
- [x] Phase color transitions
- [x] Haptic feedback on key interactions
- [x] Consistent spacing and typography
- [x] Warm terracotta color palette
- [x] All TypeScript errors resolved
- [x] All 13 unit tests passing

## V2 Upgrade
- [x] Install Zustand for state management
- [x] Define domain models (shared/types.ts)
- [x] Update database schema (couples, sessions, moods, insights tables)
- [x] Zustand partners store (couple state, streak, hydration)
- [x] Zustand session store (active session, history, AI follow-up)
- [x] Zustand mood store (my mood, partner mood)
- [x] Zustand insights store (AI-generated insights)
- [x] Zustand moments store (saved question moments)
- [x] AI tRPC router (followUp, dailyQuestion, weeklyInsight, monthlyInsight, weeklyReflection)
- [x] Couple tRPC router (create, join by code, streak management)
- [x] Session tRPC router (save session, list history)
- [x] Mood tRPC router (log mood, get recent moods)
- [x] Insights tRPC router (get/generate insights)
- [x] Onboarding screen (welcome + value prop)
- [x] Couple Pairing screen (invite code flow)
- [x] Upgraded Home screen (streak widget, mood check-in, AI daily question, recent sessions)
- [x] Mood Check-In modal
- [x] Session screen with AI follow-up questions
- [x] Session End screen with connection slider + streak increment
- [x] Daily Question screen (turn-based)
- [x] Moments tab screen (Zustand-backed)
- [x] AI Insights screen (weekly insight generation)
- [x] Session Timeline screen (history with deck colors)
- [x] Settings screen (profiles, pairing, timeline/insights shortcuts, reset)
- [x] All screens migrated from AppContext to Zustand stores
- [x] Zero TypeScript errors
- [x] All 13 tests passing

## V2 Regression Fixes (from QA audit)

### Critical
- [x] FIX-C1: Change ai.dailyQuestion from protectedProcedure to publicProcedure
- [x] FIX-C2: Fix buildSession to pad short decks to 10 questions

### High
- [x] FIX-H1: Guard endSession() against double-call in session.store
- [x] FIX-H2: Replace hardcoded "4 phases" with computed phasesCompleted in session-end
- [x] FIX-H3: Write Zustand store unit tests (partners, session, moments)

### Medium
- [x] FIX-M1: Add oauth to inAuthGroup guard in StoreHydrator
- [x] FIX-M2: Add reset() to mood, moments, and insights stores + fix settings reset
- [x] FIX-M3: Fix streak widget dots to reflect actual daily activity

### Low
- [x] FIX-L1: Write AI router weeklyInsight parsing unit test
