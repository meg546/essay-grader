---
phase: 08-collapsible-hero-grading-workspace
plan: 01
subsystem: grading-ui
tags: [animation, hero, layout, motion]
dependency_graph:
  requires: [GradingPage, EssayInput, useAppStore]
  provides: [HeroSection, collapsible-hero-flow]
  affects: [grading-page-layout]
tech_stack:
  added: [motion]
  patterns: [AnimatePresence-exit-animation, onFocus-callback-prop-drilling]
key_files:
  created:
    - src/components/grading/HeroSection.tsx
  modified:
    - src/components/grading/EssayInput.tsx
    - src/pages/GradingPage.tsx
    - package.json
decisions:
  - Hero hides entirely on collapse (not minimal bar) since header already has branding
  - No gradient or tinted background -- same background as workspace
  - Only essay textarea focus triggers collapse
  - Tween with easeInOut 300ms (not spring) for predictable animation
  - AnimatePresence initial={false} prevents mount animation flash
metrics:
  duration: 93s
  completed: 2026-03-09
---

# Phase 8 Plan 01: Collapsible Hero & Grading Workspace Summary

Motion-powered collapsible hero with AnimatePresence exit animation, triggered by essay textarea focus, with 1200px max-width workspace centering.

## What Was Built

### HeroSection Component
Created a pure presentational component (`src/components/grading/HeroSection.tsx`) rendering a centered section with "EssayGrader" title and "AI-powered essay feedback in seconds" tagline. Uses `py-12 text-center` for spacing with no background differentiation.

### Collapsible Hero Integration
Integrated the hero into `GradingPage.tsx` with:
- `AnimatePresence` wrapping a conditional `motion.div` that slides up/fades on exit
- `heroCollapsed` local state derived from `essayText !== ""` on mount
- `handleEssayFocus` callback passed through `EssayInput` to the textarea's `onFocus`
- Hero re-appears when `handleReset` fires (Grade Another click)
- Removed the "Grade Essay" h1 heading (hero title replaces it)
- Added `max-w-[1200px] mx-auto` wrapper for workspace centering

### EssayInput Enhancement
Added `onFocus` optional prop to `EssayInputProps` interface, forwarded directly to the `<Textarea>` element.

## Deviations from Plan

None -- plan executed exactly as written.

## Task Completion

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install Motion and create HeroSection component | 0cdf063 | package.json, HeroSection.tsx |
| 2 | Integrate collapsible hero into GradingPage with EssayInput onFocus | 7f42195 | EssayInput.tsx, GradingPage.tsx |

## Verification

- TypeScript compiles without errors (`npx tsc --noEmit` clean)
- `npm run build` succeeds (bundled in 2.21s)
- All success criteria met: hero visible, collapse on focus, stays collapsed, reset re-shows, existing text starts collapsed, 1200px workspace

## Self-Check: PASSED
