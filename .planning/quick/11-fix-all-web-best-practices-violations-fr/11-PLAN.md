---
phase: quick-11
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  # Task 1 — Icons, aria-labels, form inputs
  - src/components/landing/FeatureHighlights.tsx
  - src/components/landing/Footer.tsx
  - src/components/landing/HeroSection.tsx
  - src/components/landing/WalkthroughDemo.tsx
  - src/components/layout/Header.tsx
  - src/components/layout/LandingLayout.tsx
  - src/components/grading/RubricUpload.tsx
  - src/components/grading/RubricModal.tsx
  - src/components/grading/EssayUploadModal.tsx
  - src/components/grading/GradingToolbar.tsx
  - src/components/grading/GradingSettings.tsx
  - src/components/grading/ToneSelector.tsx
  - src/components/grading/EssayInput.tsx
  - src/components/onboarding/SelectableCard.tsx
  - src/components/onboarding/WelcomeStep.tsx
  - src/components/onboarding/CompletionStep.tsx
  - src/components/onboarding/GradeLevelStep.tsx
  - src/components/onboarding/WritingPurposeStep.tsx
  - src/components/results/FeedbackPanel.tsx
  - src/components/results/ColorLegend.tsx
  - src/components/results/EssayPanel.tsx
  - src/components/ui/select.tsx
  - src/pages/EssaysPage.tsx
  - src/pages/EssayDetailPage.tsx
  - src/pages/GradingPage.tsx
  - src/pages/RegisterPage.tsx
  - src/components/auth/SignInDialog.tsx
  - src/components/profile/ChangePasswordDialog.tsx
  - src/components/profile/DeleteAccountDialog.tsx
  # Task 2 — Animation, transitions, skip links, modals
  - src/index.css
  - src/components/ui/button.tsx
  - src/components/ui/sheet.tsx
  - src/components/ui/dialog.tsx
  - src/components/layout/Layout.tsx
  - src/components/results/CategoryFeedback.tsx
  - src/components/results/ScoreBar.tsx
  - src/components/results/HighlightedEssay.tsx
  # Task 3 — Typography, anti-patterns, focus
  - src/components/landing/HowItWorks.tsx
  - src/components/results/ScoreOverview.tsx
  - src/components/results/ResultsSummary.tsx
  - src/pages/ProfilePage.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "All decorative icons have aria-hidden=true"
    - "All form inputs have name, autocomplete, and labels"
    - "All icon-only buttons have aria-label"
    - "prefers-reduced-motion media query disables animations globally"
    - "No transition-all remains in codebase"
    - "Skip to content link exists on both layouts"
    - "Modal dialogs contain overscroll"
    - "Ellipsis characters use proper unicode"
    - "Headings use text-balance where specified"
    - "No div-with-click-handler anti-patterns remain"
    - "Focus states are visible"
  artifacts:
    - path: "src/index.css"
      provides: "prefers-reduced-motion global rule"
      contains: "prefers-reduced-motion"
    - path: "src/components/layout/Layout.tsx"
      provides: "Skip to content link"
      contains: "Skip to content"
    - path: "src/components/layout/LandingLayout.tsx"
      provides: "Skip to content link"
      contains: "Skip to content"
  key_links: []
---

<objective>
Fix ~85 web best practices violations across the codebase identified by audit.

Purpose: Improve accessibility, performance, and standards compliance across the entire frontend.
Output: All violations resolved across ~50 files in 10 categories.
</objective>

<execution_context>
@/Users/matthewgardner/.claude/get-shit-done/workflows/execute-plan.md
@/Users/matthewgardner/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Icon accessibility, form inputs, and aria-labels (Categories 1, 2, 10)</name>
  <files>
    src/components/landing/FeatureHighlights.tsx,
    src/components/landing/Footer.tsx,
    src/components/landing/HeroSection.tsx,
    src/components/landing/WalkthroughDemo.tsx,
    src/components/layout/Header.tsx,
    src/components/layout/LandingLayout.tsx,
    src/components/grading/RubricUpload.tsx,
    src/components/grading/RubricModal.tsx,
    src/components/grading/EssayUploadModal.tsx,
    src/components/grading/GradingToolbar.tsx,
    src/components/grading/GradingSettings.tsx,
    src/components/grading/ToneSelector.tsx,
    src/components/grading/EssayInput.tsx,
    src/components/onboarding/SelectableCard.tsx,
    src/components/onboarding/WelcomeStep.tsx,
    src/components/onboarding/CompletionStep.tsx,
    src/components/onboarding/GradeLevelStep.tsx,
    src/components/onboarding/WritingPurposeStep.tsx,
    src/components/results/FeedbackPanel.tsx,
    src/components/results/ColorLegend.tsx,
    src/components/results/EssayPanel.tsx,
    src/components/ui/select.tsx,
    src/pages/EssaysPage.tsx,
    src/pages/EssayDetailPage.tsx,
    src/pages/GradingPage.tsx,
    src/pages/RegisterPage.tsx,
    src/components/auth/SignInDialog.tsx,
    src/components/profile/ChangePasswordDialog.tsx,
    src/components/profile/DeleteAccountDialog.tsx
  </files>
  <action>
## Category 1: Add aria-hidden="true" to ALL decorative icons

For Lucide icons rendered as JSX components, add the `aria-hidden="true"` prop. For inline SVGs, add `aria-hidden="true"` to the svg element.

Specific locations:
- src/components/landing/FeatureHighlights.tsx:68 — `feature.icon` is rendered dynamically. Where the icon component is rendered (e.g. `<feature.icon .../>`) add aria-hidden="true"
- src/components/landing/Footer.tsx:8 — `<GraduationCap>` add aria-hidden="true"
- src/components/landing/HeroSection.tsx:20 — `<GraduationCap>` add aria-hidden="true"
- src/components/landing/WalkthroughDemo.tsx:172 — inline SVG checkmark, add aria-hidden="true" to `<svg>` element
- src/components/layout/Header.tsx:57 — `<GraduationCapIcon>` add aria-hidden="true"
- src/components/layout/LandingLayout.tsx:19 — `<GraduationCapIcon>` add aria-hidden="true"
- src/components/grading/RubricUpload.tsx:87 — `<FileText>`, :115 — `<Upload>` — add aria-hidden="true" to both
- src/components/grading/RubricModal.tsx:94 — `<FileText>`, :122 — `<Upload>` — add aria-hidden="true" to both
- src/components/grading/EssayUploadModal.tsx:127 — `<FileText>`, :155 — `<Upload>` — add aria-hidden="true" to both
- src/components/grading/GradingToolbar.tsx:112 `<BookOpen>`, :119 `<FileUp>`, :131 `<BarChart3>`, :138 `<Clock>`, :148 `<Eraser>` — add aria-hidden="true" to all five
- src/components/grading/GradingSettings.tsx:50 — `<Settings>` add aria-hidden="true"
- src/components/grading/ToneSelector.tsx:35 — `<MessageSquare>` add aria-hidden="true"
- src/components/onboarding/SelectableCard.tsx:23 — icon prop rendered as component, add aria-hidden="true"
- src/components/onboarding/WelcomeStep.tsx:11 — `<Sparkles>` add aria-hidden="true"
- src/components/onboarding/CompletionStep.tsx:25 — `<Check>` add aria-hidden="true"
- src/components/onboarding/GradeLevelStep.tsx:67 — `<Loader2>` add aria-hidden="true"
- src/components/onboarding/WritingPurposeStep.tsx:54 — `<Loader2>` add aria-hidden="true"
- src/components/results/FeedbackPanel.tsx:20 — `<Loader2>` add aria-hidden="true"
- src/components/results/ColorLegend.tsx:40 — `<Eye>`/`<EyeOff>` add aria-hidden="true" to both
- src/components/ui/select.tsx:50 — `<ChevronDownIcon>`, :163-164 — `<ChevronUpIcon>`/`<ChevronDownIcon>` — add aria-hidden="true" to all three
- src/pages/EssaysPage.tsx:38 — `<Loader2>` add aria-hidden="true"
- src/pages/EssayDetailPage.tsx:33 — `<Loader2>` add aria-hidden="true"
- src/pages/GradingPage.tsx — `<Loader2>` add aria-hidden="true"
- src/pages/RegisterPage.tsx:96 — `<Loader2>` add aria-hidden="true"
- src/components/auth/SignInDialog.tsx:126,:165 — `<Loader2>` add aria-hidden="true" to both instances

## Category 2: Form input attributes

**src/components/auth/SignInDialog.tsx:**
- Sign-in email input: add name="email", autoComplete="email", spellCheck={false}
- Sign-in password input: add name="password", autoComplete="current-password"
- Register email input: add name="email", autoComplete="email", spellCheck={false}
- Register password input: add name="password", autoComplete="new-password"
- Register confirm password input: add name="confirmPassword", autoComplete="new-password"

**src/pages/RegisterPage.tsx:**
- Email input: add name="email", autoComplete="email", spellCheck={false}
- Password input: add name="password", autoComplete="new-password"
- Confirm password input: add name="confirmPassword", autoComplete="new-password"

**src/components/profile/ChangePasswordDialog.tsx:**
- Current password input: add name="currentPassword", autoComplete="current-password"
- New password input: add name="newPassword", autoComplete="new-password"
- Confirm password input: add name="confirmPassword", autoComplete="new-password"

**src/components/profile/DeleteAccountDialog.tsx:**
- Password input: add name="password", autoComplete="current-password"

**src/components/grading/EssayInput.tsx:**
- Textarea: add aria-label="Essay text"

**src/components/grading/RubricUpload.tsx:133:**
- Hidden file input: add aria-label="Upload rubric file"

**src/components/grading/RubricModal.tsx:141:**
- Hidden file input: add aria-label="Upload rubric file"

**src/components/grading/EssayUploadModal.tsx:174:**
- Hidden file input: add aria-label="Upload essay file"

**src/components/grading/GradingSettings.tsx:62-78:**
- Select element: add aria-label="Grading settings"

## Category 10: Icon-only buttons need aria-label

- src/components/grading/RubricUpload.tsx:89-96 — X button: add aria-label="Remove rubric"
- src/components/grading/RubricModal.tsx:96-103 — X button: add aria-label="Remove rubric"
- src/components/grading/EssayUploadModal.tsx:129-136 — X button: add aria-label="Remove file"
- src/components/results/EssayPanel.tsx:39-49 — Pencil/Check toggle button: add aria-label="Edit essay" when showing Pencil, aria-label="Save edit" when showing Check
  </action>
  <verify>
    <automated>cd /Users/matthewgardner/essay-grader && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>All decorative icons have aria-hidden="true", all form inputs have name/autocomplete/labels, all icon-only buttons have aria-label.</done>
</task>

<task type="auto">
  <name>Task 2: Animation, transitions, skip links, and modal containment (Categories 3, 4, 5, 7)</name>
  <files>
    src/index.css,
    src/components/ui/button.tsx,
    src/components/ui/sheet.tsx,
    src/components/ui/dialog.tsx,
    src/components/layout/Layout.tsx,
    src/components/layout/LandingLayout.tsx,
    src/components/grading/EssayInput.tsx,
    src/components/grading/ToneSelector.tsx,
    src/components/grading/GradingToolbar.tsx,
    src/components/grading/GradingSettings.tsx,
    src/components/onboarding/SelectableCard.tsx,
    src/components/results/CategoryFeedback.tsx,
    src/components/results/ScoreBar.tsx,
    src/components/results/HighlightedEssay.tsx
  </files>
  <action>
## Category 3: Global prefers-reduced-motion

In src/index.css, add at the END of the file:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

## Category 4: Replace transition-all with specific properties

Each file below — find the `transition-all` class and replace with the specified value:

- src/components/ui/button.tsx — `transition-all` to `transition-colors`
- src/components/grading/EssayInput.tsx:134 — `transition-all` to `transition-colors`
- src/components/grading/ToneSelector.tsx:31 — `transition-all` to `transition-colors`
- src/components/grading/GradingToolbar.tsx:58 — `transition-all` to `transition-colors`
- src/components/grading/GradingSettings.tsx:46 — `transition-all` to `transition-colors`
- src/components/onboarding/SelectableCard.tsx:17 — `transition-all` to `transition-[colors,shadow]`
- src/components/results/CategoryFeedback.tsx:41 — `transition-all` to `transition-[colors,shadow]`
- src/components/results/ScoreBar.tsx:20 — `transition-all` to `transition-[width]`
- src/components/results/HighlightedEssay.tsx:148 — `transition-all` to `transition-[background-color,opacity]`
- src/components/ui/sheet.tsx:56 — bare `transition` class to `transition-transform`

## Category 5: Skip to content links

**src/components/layout/Layout.tsx:**
Add immediately as the first child inside the outermost wrapper (before the header):
```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-primary"
>
  Skip to content
</a>
```
Then find the `<main>` element and add `id="main-content"` to it.

**src/components/layout/LandingLayout.tsx:**
Same pattern — add the skip link as the first child inside the outermost wrapper, and add `id="main-content"` to the `<main>` element.

## Category 7: Modal scroll containment

**src/components/ui/dialog.tsx:**
Find the DialogContent component's inner div/element and add `overscrollBehavior: 'contain'` as inline style, or add className `overscroll-contain`.

**src/components/ui/sheet.tsx:**
Find the SheetContent component's inner element and add className `overscroll-contain`.
  </action>
  <verify>
    <automated>cd /Users/matthewgardner/essay-grader && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>prefers-reduced-motion global rule exists, all transition-all replaced with specific properties, skip links in both layouts, modal overscroll contained.</done>
</task>

<task type="auto">
  <name>Task 3: Typography, anti-patterns, and focus fixes (Categories 6, 8, 9)</name>
  <files>
    src/pages/GradingPage.tsx,
    src/components/auth/SignInDialog.tsx,
    src/components/landing/WalkthroughDemo.tsx,
    src/components/grading/EssayUploadModal.tsx,
    src/components/onboarding/CompletionStep.tsx,
    src/components/onboarding/GradeLevelStep.tsx,
    src/components/grading/EssayInput.tsx,
    src/pages/RegisterPage.tsx,
    src/pages/ProfilePage.tsx,
    src/pages/EssaysPage.tsx,
    src/pages/EssayDetailPage.tsx,
    src/components/landing/HeroSection.tsx,
    src/components/landing/HowItWorks.tsx,
    src/components/landing/FeatureHighlights.tsx,
    src/components/results/ScoreOverview.tsx,
    src/components/results/FeedbackPanel.tsx,
    src/components/results/ResultsSummary.tsx,
    src/components/grading/GradingToolbar.tsx
  </files>
  <action>
## Category 6: Typography fixes

### Replace "..." with proper ellipsis character "…"

Search for the literal string "..." in JSX text content in these files and replace with the unicode ellipsis "…" (U+2026):
- src/pages/GradingPage.tsx — any "..." in text/placeholder content
- src/components/auth/SignInDialog.tsx — any "..." in text/button content
- src/components/landing/WalkthroughDemo.tsx — any "..." in text content
- src/components/grading/EssayUploadModal.tsx — any "..." in text content
- src/components/onboarding/CompletionStep.tsx — any "..." in text content
- src/components/onboarding/GradeLevelStep.tsx — any "..." in text content
- src/components/grading/EssayInput.tsx — any "..." in placeholder text

NOTE: Do NOT replace "..." inside JS code (spread operators, etc.) — only in user-visible strings, placeholders, and JSX text.

### Add text-balance to headings

Add className `text-balance` to the primary heading (h1/h2) in each of these files:
- src/pages/RegisterPage.tsx — main heading
- src/pages/ProfilePage.tsx — main heading
- src/pages/EssaysPage.tsx — main heading
- src/pages/EssayDetailPage.tsx — main heading
- src/pages/GradingPage.tsx — main heading (if present)
- src/components/landing/HeroSection.tsx — hero heading
- src/components/landing/HowItWorks.tsx — section heading
- src/components/landing/FeatureHighlights.tsx — section heading
- src/components/landing/WalkthroughDemo.tsx — section heading
- src/components/results/ScoreOverview.tsx — heading
- src/components/results/FeedbackPanel.tsx — heading

### Add tabular-nums to score numbers

Add className `tabular-nums` to score number displays in:
- src/pages/EssaysPage.tsx — score numbers in essay list
- src/components/landing/WalkthroughDemo.tsx — score numbers in demo
- src/components/results/ResultsSummary.tsx — score numbers

## Category 8: Fix div-with-click-handler anti-patterns

**src/pages/EssaysPage.tsx:**
Find the Card component that has an `onClick` with `navigate(...)`. Replace with wrapping the Card content in a `<Link to={...}>` from react-router-dom instead. Remove the onClick handler from the div. Import Link if not already imported. Ensure the Link wraps the clickable area and the cursor-pointer styling moves to the Link.

**src/components/grading/GradingToolbar.tsx:134-138:**
Find the history button that uses `onClick` with `navigate("/history")`. Replace with a `<Link to="/history">` component. Import Link from react-router-dom if not already imported. Keep the same styling.

## Category 9: Focus state fixes

**src/components/grading/EssayInput.tsx:144:**
Find `focus-visible:ring-0` and change to `focus-visible:ring-2`. This ensures the textarea has a visible focus indicator.

**src/components/auth/SignInDialog.tsx:**
Find the tab trigger buttons (Sign In / Register tabs). Add `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2` to their className.
  </action>
  <verify>
    <automated>cd /Users/matthewgardner/essay-grader && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>All "..." replaced with "…" in user-visible text, text-balance on specified headings, tabular-nums on score numbers, div-click anti-patterns fixed with Link, focus states visible.</done>
</task>

</tasks>

<verification>
1. TypeScript compiles: `npx tsc --noEmit` passes
2. Build succeeds: `npm run build` completes without errors
3. Grep confirms no remaining transition-all: `grep -r "transition-all" src/` returns no results
4. Grep confirms skip links exist: `grep -r "Skip to content" src/components/layout/`
5. Grep confirms reduced-motion: `grep -r "prefers-reduced-motion" src/index.css`
</verification>

<success_criteria>
All 85 audit violations resolved. Build passes. No transition-all remaining. Skip links present. Reduced motion respected. All forms accessible. All icons properly marked.
</success_criteria>

<output>
After completion, create `.planning/quick/11-fix-all-web-best-practices-violations-fr/11-SUMMARY.md`
</output>
