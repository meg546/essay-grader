---
phase: quick-12
plan: 01
subsystem: ui
tags: [dark-mode, responsive, accessibility, text-size, mobile]
dependency_graph:
  requires: []
  provides: [theme-module, text-size-control, mobile-grading-layout, dark-mode]
  affects: [src/stores/app-store.ts, src/lib/theme.ts, src/index.css, index.html, src/components/layout/Header.tsx, src/components/layout/LandingLayout.tsx, src/pages/GradingPage.tsx]
tech_stack:
  added: [useSyncExternalStore, Sheet component for mobile nav]
  patterns: [CSS custom properties for theme tokens, inline flash-prevention script, segmented control UI pattern]
key_files:
  created:
    - src/lib/theme.ts
  modified:
    - src/stores/app-store.ts
    - src/components/grading/GradingSettings.tsx
    - src/components/grading/EssayInput.tsx
    - src/components/results/EssayPanel.tsx
    - src/index.css
    - index.html
    - src/components/layout/Header.tsx
    - src/components/layout/LandingLayout.tsx
    - src/lib/highlight-utils.ts
    - src/lib/score-utils.ts
    - src/pages/GradingPage.tsx
    - src/components/grading/GradingToolbar.tsx
decisions:
  - Theme state lives outside Zustand — must apply before React mounts for flash prevention (useSyncExternalStore used for React hook integration)
  - textSize persisted via Zustand app-store v3 partialize (not theme module) since it's user preference not theme state
  - Mobile tab visibility done via cn + hidden class rather than conditional rendering to preserve component state
  - GradingToolbar dividers hidden on mobile with hidden md:block to avoid layout issues in horizontal flex
metrics:
  duration: ~20min
  completed: 2026-03-11
  tasks: 3
  files: 13
---

# Quick Task 12: Reading Comfort & Responsive Design Summary

**One-liner:** Three-feature UX update: text size segmented control (3-step, persisted), system-aware dark mode with flash prevention via inline script, and fully responsive grading page with mobile toolbar/tabs/hamburger nav.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Text Size Control | 215c50a | app-store.ts, GradingSettings.tsx, EssayInput.tsx, EssayPanel.tsx |
| 2 | Dark Mode | 3a3fcb5 | theme.ts (new), index.html, index.css, Header.tsx, LandingLayout.tsx, highlight-utils.ts, score-utils.ts |
| 3 | Mobile-Optimized Grading | eaa8d4b | GradingPage.tsx, GradingToolbar.tsx |

## What Was Built

### Task 1: Text Size Control
- Added `textSize: 'small' | 'normal' | 'large'` to app-store with default `'normal'`
- Bumped store version to 3 with migration that defaults `textSize = 'normal'`
- Updated `partialize` to persist both `essayText` and `textSize`
- Added segmented control (3 buttons with visual A anchors at xs/sm/base sizes) in GradingSettings popover
- Reset button now resets both grade level override AND text size
- Applied `TEXT_SIZE_CLASS` map dynamically to essay textarea (EssayInput) and essay panel (EssayPanel, both edit and view modes)

### Task 2: Dark Mode
- Created `src/lib/theme.ts`: `getTheme`, `getResolvedTheme`, `setTheme`, `toggleTheme`, `onThemeChange` (pub/sub with Set), `useTheme` React hook via `useSyncExternalStore`
- Added flash prevention inline script to `index.html` before module scripts
- Added `<meta name="theme-color">` (light: `#faf9f6`, dark: `#0f1117`) managed by `applyTheme()`
- Added `--highlight-strength` and `--highlight-improvement` CSS tokens to `:root` and `.dark` blocks
- Added `transition-colors duration-200` to `html` element for smooth switching
- Sun/Moon toggle button added to both Header and LandingLayout (always visible, never collapses into mobile menu)
- Updated all 6 `CATEGORY_COLORS` entries in `highlight-utils.ts` with `dark:` variants
- Updated `getScoreTextColor` in `score-utils.ts` with `dark:` variants
- Fixed `focus:bg-white` hardcoded color in LandingLayout skip-to-content link → `focus:bg-background`

### Task 3: Mobile-Optimized Grading
- GradingPage input view: `flex-col md:flex-row` layout so toolbar stacks below textarea on mobile
- GradingPage submit: sticky at bottom on mobile, full-width button, desktop unchanged
- GradingPage results: mobile-only tab bar (Essay/Feedback) with 44px touch targets, conditional panel visibility via `cn("md:block", hidden)` pattern
- GradingToolbar: `flex-row md:flex-col` with `w-full md:w-12`, dividers hidden on mobile
- Header: desktop nav `hidden md:flex`, mobile hamburger button opens Sheet drawer with same nav items
- LandingLayout: desktop Sign In button `hidden md:inline-flex`, mobile hamburger Sheet with Sign In

## Deviations from Plan

None — plan executed exactly as written. The `onThemeChange` subscription pattern was implemented to return an unsubscribe function for `useSyncExternalStore` compatibility (the callback style differs slightly from the plan spec but achieves the same effect).

## Self-Check: PASSED

All files verified:
- `src/lib/theme.ts` — created
- `src/stores/app-store.ts` — version 3, textSize state
- `src/components/grading/GradingSettings.tsx` — segmented text size control
- `src/components/grading/EssayInput.tsx` — dynamic TEXT_SIZE_CLASS
- `src/components/results/EssayPanel.tsx` — dynamic TEXT_SIZE_CLASS
- `src/index.css` — highlight tokens + html transition
- `index.html` — flash prevention script + meta theme-color
- `src/components/layout/Header.tsx` — theme toggle + mobile hamburger
- `src/components/layout/LandingLayout.tsx` — theme toggle + mobile hamburger
- `src/lib/highlight-utils.ts` — dark: variants on CATEGORY_COLORS
- `src/lib/score-utils.ts` — dark: variants on score text colors
- `src/pages/GradingPage.tsx` — mobile layout + resultTab state
- `src/components/grading/GradingToolbar.tsx` — horizontal mobile layout

Commits verified: 215c50a, 3a3fcb5, eaa8d4b
TypeScript: `npx tsc --noEmit` passes with no errors
