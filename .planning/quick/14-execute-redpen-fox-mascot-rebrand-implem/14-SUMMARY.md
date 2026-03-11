# Quick Task 14: Execute Redpen Fox Mascot Rebrand Implementation Plan

**Date:** 2026-03-11
**Status:** Complete
**Commits:** 20 atomic commits (52fd094..85a4879)

## What Was Done

### Phase A — Rebrand (6 commits)
- Updated all CSS custom properties from sage green (hue 145) to muted crimson (hue 25) in light and dark mode
- Changed page title from "EssayGrader" to "Redpen"
- Replaced GraduationCapIcon with PenToolIcon across LandingLayout and Header
- Updated all landing page copy (HeroSection, FeatureHighlights, HowItWorks, Footer)
- Found and updated remaining reference in WelcomeStep.tsx

### Phase B — Fox Mascot Foundation (4 commits)
- Created fox state types with 9 states and transition logic
- Created Zustand fox store with persist middleware (isHidden only)
- Created consolidated FoxBase SVG sprite with per-state expressions
- Created FoxAnimation wrapper with motion/react and reduced-motion support

### Phase B — Speech Bubble + Container (3 commits)
- Created SpeechBubble with auto-dismiss (10s), focus pause, Escape, aria-live
- Created FoxCompanion container (fixed bottom-right, memo'd, keyboard accessible)
- Mounted FoxCompanion in App.tsx after Routes

### Phase B — Reactive Behaviors (4 commits)
- Fox waves on landing page
- Fox reacts to typing (attentive), submitting (thinking), and results (celebrating/encouraging)
- Fox browses on history page
- Fox falls asleep after 2 minutes idle

### Phase B — Backend Coaching (4 commits)
- Created CoachContext enum, CoachRequest/CoachResponse schemas
- Created coach service with LLM-powered tips, history summary, fallback messages
- Created POST /api/coach endpoint with auth
- Updated LLM client protocol to support plain text (no JSON schema) calls

### Phase B — Frontend Coaching Integration (5 commits — reduced to 3 due to combining)
- Created frontend coach API client
- Created useFoxCoach hook with 30s debounce and caching
- Wired coaching to GradingPage (results_received), EssaysPage (history_visit)
- Replaced placeholder click handler with on-demand coaching
- Added first-visit-of-day greeting via localStorage

## Files Changed

### Created (12 files)
- `src/components/mascot/fox-states.ts`
- `src/stores/fox-store.ts`
- `src/components/mascot/sprites/FoxBase.tsx`
- `src/components/mascot/sprites/index.ts`
- `src/components/mascot/FoxAnimation.tsx`
- `src/components/mascot/SpeechBubble.tsx`
- `src/components/mascot/FoxCompanion.tsx`
- `src/api/coach.ts`
- `src/components/mascot/use-fox-coach.ts`
- `backend/app/schemas/coach.py`
- `backend/app/services/coach.py`
- `backend/app/routes/coach.py`

### Modified (12 files)
- `src/index.css` (color theme)
- `index.html` (page title)
- `src/components/layout/LandingLayout.tsx` (brand icon + name)
- `src/components/layout/Header.tsx` (brand icon + name)
- `src/components/landing/HeroSection.tsx` (copy)
- `src/components/landing/FeatureHighlights.tsx` (copy)
- `src/components/landing/Footer.tsx` (copy)
- `src/components/onboarding/WelcomeStep.tsx` (copy)
- `src/App.tsx` (mount FoxCompanion)
- `src/pages/LandingPage.tsx` (fox triggers)
- `src/pages/GradingPage.tsx` (fox triggers + coaching)
- `src/pages/EssaysPage.tsx` (fox triggers + coaching)
- `backend/app/main.py` (coach router)
- `backend/app/llm/client.py` (protocol update)
- `backend/app/llm/anthropic.py` (plain text support)
- `backend/app/llm/openai.py` (plain text support)
- `backend/app/llm/ollama.py` (plain text support)

## Verification
- TypeScript: `npx tsc --noEmit` passes cleanly
- All 20 commits are atomic and follow the master plan's commit messages
