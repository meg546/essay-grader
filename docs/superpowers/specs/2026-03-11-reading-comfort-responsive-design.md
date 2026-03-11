# Reading Comfort & Responsive Update

**Date:** 2026-03-11
**Status:** Approved
**Scope:** Text size control, dark mode, mobile-optimized grading

## Overview

A cohesive update that improves the reading/writing experience across devices. Three features designed together and shipped as one update to ensure consistent theming and layout behavior.

## Feature 1: Text Size Control

### What
A 3-step text size selector (Small / Normal / Large) in the GradingSettings popover, next to the existing grade level override.

### Behavior
- **Small:** 14px (`text-sm`) — compact view for long essays
- **Normal:** 16px (`text-base`, default) — current behavior
- **Large:** 18px (`text-lg`) — accessibility/comfort for extended reading
- Affects only the essay textarea (input and results EssayPanel)
- Persisted in Zustand app store → localStorage
- Existing "Reset to profile default" button also resets text size back to Normal

### UI
- Rendered as a segmented control or discrete slider with labels
- Small "A" on left, large "A" on right as visual anchors
- Tick marks at each step with labels below (Small / Normal / Large)
- Placed below the existing grade level selector in the GradingSettings popover (which uses `PopoverTrigger` with `render` prop pattern from base-ui)

### Implementation
- Add `textSize: 'small' | 'normal' | 'large'` to app store
- Update `partialize` in app store to include `textSize` (currently only persists `essayText`)
- Bump store `version` to 3 with migration that defaults `textSize` to `'normal'`
- Map values to Tailwind classes: `text-sm`, `text-base`, `text-lg`
- Apply class to essay textarea in `EssayInput.tsx` and essay content in `EssayPanel.tsx`

### Files Modified
- `src/stores/app-store.ts` — add `textSize` state + setter, update `partialize` and version migration
- `src/components/grading/GradingSettings.tsx` — add text size control UI below grade level
- `src/components/grading/EssayInput.tsx` — apply dynamic text size class to textarea
- `src/components/results/EssayPanel.tsx` — apply dynamic text size class to essay content

## Feature 2: Dark Mode

### What
System-aware dark theme with manual toggle override. Sun/moon icon in the header.

### Behavior
- Defaults to system preference via `prefers-color-scheme`
- User can override via header toggle (sun/moon icon)
- Override persisted in localStorage under key `"essay-grader-theme"`
- Three states: `system` (default), `light`, `dark`
- Toggle cycles: current resolved appearance → opposite (click sun → dark, click moon → light)
- To reset to system: hold/long-press toggle or access via profile settings

### Theme Architecture

**Existing infrastructure (no changes needed):**
- Tailwind v4 CSS-based config — dark mode already configured via `@custom-variant dark (&:is(.dark *));` in `index.css` line 5
- `.dark { ... }` block already exists in `index.css` (lines 53-85) with all base color tokens
- No `tailwind.config.ts` exists — this project uses Tailwind v4 CSS config exclusively

**New work:**
- Add `--highlight-strength` and `--highlight-improvement` tokens for essay feedback highlight colors
  - Light: `--highlight-strength: 142 76% 90%;` `--highlight-improvement: 38 92% 90%;`
  - Dark: `--highlight-strength: 142 40% 25%;` `--highlight-improvement: 38 50% 25%;`
- Audit components for hardcoded colors that don't use design tokens
- Theme state lives outside Zustand intentionally — it must apply before React mounts (flash prevention)

### Components Requiring Dark Mode Audit
Grep for hardcoded `bg-white`, `bg-gray-*`, `text-gray-*`, `border-gray-*`, `bg-green-*`, hex colors in:
- `src/components/results/HighlightedEssay.tsx` — highlight background colors
- `src/components/results/ScoreBar.tsx` — bar colors
- `src/components/results/ColorLegend.tsx` — legend color swatches
- `src/components/landing/WalkthroughDemo.tsx` — demo mockup colors
- `src/components/grading/EssayInput.tsx` — drop zone overlay
- `src/components/onboarding/*.tsx` — wizard step backgrounds

### UI
- Sun icon (`Sun` from lucide-react) when in light mode / Moon icon (`Moon`) when in dark mode
- Placed in header bar, before any nav items
- Smooth transition on theme switch: `transition-colors duration-200` on `<html>`

### Meta Theme Color
- `<meta name="theme-color">` managed by `theme.ts` — updates `document.querySelector('meta[name="theme-color"]').content`
- Light value: `#faf9f6` (current warm cream background)
- Dark value: `#0f1117` (dark background)

### Flash Prevention Script
Add inline script to `index.html` `<head>` before any other scripts:
```javascript
<script>
(function() {
  var t = localStorage.getItem('essay-grader-theme');
  var d = t === 'dark' || (t !== 'light' && matchMedia('(prefers-color-scheme:dark)').matches);
  if (d) document.documentElement.classList.add('dark');
})();
</script>
```

### Files Modified
- `src/index.css` — add `--highlight-strength` and `--highlight-improvement` tokens to both `:root` and `.dark` blocks
- `index.html` — add inline flash prevention script
- `src/lib/theme.ts` (new) — theme detection, toggle logic, localStorage sync, meta theme-color updates
- `src/components/layout/Header.tsx` — add theme toggle button (Sun/Moon icon)
- `src/components/layout/LandingLayout.tsx` — add theme toggle button
- Components listed in audit section — replace hardcoded colors with theme-aware variants

## Feature 3: Mobile-Optimized Grading

### What
Responsive layout for the grading page at < 768px breakpoint. Full grading workflow on mobile.

### Breakpoint
- < 768px: mobile layout (stacked, tabs, touch targets)
- ≥ 768px: desktop layout (current side-by-side)
- Uses Tailwind's `md:` breakpoint (768px) — no custom breakpoints needed

### Input View (Mobile)
- Essay textarea takes full width
- Toolbar becomes horizontal row of icon buttons below textarea (instead of vertical sidebar)
- Upload, Rubric, Settings buttons in a compact row
- Submit button full-width, sticky at viewport bottom
- Touch targets minimum 44px

### Results View (Mobile)
- Tab UI: "Essay" | "Feedback" tabs at top
- Only one panel visible at a time
- `GradingPage.tsx` owns a `resultTab: 'essay' | 'feedback'` state, passed as props to conditionally render `EssayPanel` or `FeedbackPanel`
- Score summary visible above tabs (always visible context)
- Swipe gesture not included in v1

### Header (Mobile)
- Logo + hamburger menu icon (visible < 768px, hidden ≥ 768px)
- Navigation items collapse into slide-out sheet (existing `Sheet` component)
- Theme toggle remains visible in header (doesn't collapse into menu)

### Landing Page
- Already largely responsive — minor touch-ups only
- Hero CTA buttons stack vertically on mobile
- Feature cards single column on mobile

### Files Modified
- `src/pages/GradingPage.tsx` — responsive layout, `resultTab` state, conditional panel rendering, sticky submit
- `src/components/grading/GradingToolbar.tsx` — horizontal layout variant via `flex-row md:flex-col`
- `src/components/grading/EssayInput.tsx` — full-width mobile styling
- `src/components/results/EssayPanel.tsx` — accepts `visible` prop for tab-based display
- `src/components/results/FeedbackPanel.tsx` — accepts `visible` prop for tab-based display
- `src/components/layout/Header.tsx` — hamburger menu trigger, Sheet-based mobile nav
- `src/components/layout/LandingLayout.tsx` — hamburger menu for mobile nav

## Shared Infrastructure

### Design Tokens
Most colors already centralized as CSS custom properties in `index.css` with `.dark` variants. The remaining work is adding feedback highlight tokens and auditing for hardcoded colors.

### App Store Changes
```typescript
// Added to app-store.ts
textSize: 'small' | 'normal' | 'large'  // default: 'normal'
setTextSize: (size: 'small' | 'normal' | 'large') => void

// Update partialize to include textSize
partialize: (state) => ({ essayText: state.essayText, textSize: state.textSize })

// Bump version to 3, add migration
version: 3,
migrate: (persisted, version) => {
  if (version < 2) { /* existing migration */ }
  if (version < 3) { persisted.textSize = 'normal'; }
  return persisted;
}
```

### Theme Module
```typescript
// src/lib/theme.ts (new)
// Intentionally outside Zustand — must work before React mounts for flash prevention
type Theme = 'system' | 'light' | 'dark'
getTheme(): Theme                        // raw user preference
setTheme(theme: Theme): void             // persist + apply
getResolvedTheme(): 'light' | 'dark'     // what's actually applied
onThemeChange(callback): unsubscribe     // for React components to subscribe
```
localStorage key: `"essay-grader-theme"`

## Testing Considerations
- Dark mode: verify all pages render correctly in both themes
- Text size: verify textarea respects all 3 sizes in both input and results
- Mobile: test grading flow end-to-end at < 768px viewport
- Theme persistence: verify localStorage survives refresh
- Flash prevention: verify no white flash on dark mode page load
- Accessibility: dark mode contrast ratios meet WCAG AA (4.5:1 for text)
- Store migration: verify existing users' localStorage upgrades cleanly to version 3

## Out of Scope
- Font family selection
- Line spacing control
- Tablet-specific layouts (tablets get desktop layout)
- Dark mode for email notifications
- Per-essay text size memory
- Swipe gestures for mobile tab navigation
