# Quick Task 11: Fix All Web Best Practices Violations from Audit

**Date:** 2026-03-11
**Status:** Complete
**Commits:** 71826c0, df96235, 1f3027c, 85b0f46

## What Changed

### Category 1: Decorative Icons (25+ locations)
Added `aria-hidden="true"` to all decorative Lucide icons and inline SVGs across 20+ files.

### Category 2: Form Inputs
Added `name`, `autoComplete`, `spellCheck={false}` to all form inputs in SignInDialog, RegisterPage, ChangePasswordDialog, DeleteAccountDialog. Added `aria-label` to textarea in EssayInput, hidden file inputs, and GradingSettings select.

### Category 3: Reduced Motion
Added global `@media (prefers-reduced-motion: reduce)` query to index.css that disables all animations and transitions.

### Category 4: Transition-All Removal
Replaced `transition-all` with specific transition properties in 11 files (button.tsx, EssayInput, ToneSelector, GradingToolbar, GradingSettings, SelectableCard, CategoryFeedback, ScoreBar, HighlightedEssay, sheet.tsx, WordStats).

### Category 5: Skip Links
Added "Skip to content" links (sr-only/focus:not-sr-only) to both Layout.tsx and LandingLayout.tsx with `id="main-content"` on `<main>`.

### Category 6: Typography
- Replaced `"..."` with `"…"` in 7 files
- Added `text-balance` to headings in 11 files
- Added `tabular-nums` to score numbers in 3 files

### Category 7: Modal Containment
Added `overscroll-contain` to dialog.tsx and sheet.tsx content wrappers.

### Category 8: Anti-Pattern Fixes
- EssaysPage: Replaced Card onClick+navigate with `<Link>` wrapper
- GradingToolbar: Replaced history button onClick+navigate with `<Link>`

### Category 9: Focus States
- EssayInput: Changed `focus-visible:ring-0` → `focus-visible:ring-2`
- SignInDialog: Added visible focus ring to tab buttons

### Category 10: Icon-Only Buttons
Added `aria-label` to all icon-only buttons (remove rubric/file buttons, edit/save toggle).

## Files Modified
~45 files across src/components/ and src/pages/

## Verification
- TypeScript: zero new errors
- No `transition-all` remaining in codebase
- Skip links present in both layouts
- prefers-reduced-motion query in index.css
