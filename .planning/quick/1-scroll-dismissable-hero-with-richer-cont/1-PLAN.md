---
phase: quick
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/grading/HeroSection.tsx
  - src/pages/GradingPage.tsx
autonomous: true
requirements: [QUICK-1]
must_haves:
  truths:
    - "Hero collapses when user scrolls down on the grading page"
    - "Hero stays collapsed after scrolling back up"
    - "Hero displays richer content beyond just title and subtitle"
    - "Existing header branding is unaffected"
  artifacts:
    - path: "src/components/grading/HeroSection.tsx"
      provides: "Richer hero content with feature highlights"
    - path: "src/pages/GradingPage.tsx"
      provides: "Scroll-based hero collapse logic"
  key_links:
    - from: "src/pages/GradingPage.tsx"
      to: "window scroll event"
      via: "useEffect with scroll listener"
      pattern: "addEventListener.*scroll"
---

<objective>
Make the hero section collapse on scroll-down and stay collapsed, plus enrich its content so it feels more engaging on first visit.

Purpose: The hero currently collapses on textarea focus which is jarring. Scroll-based dismissal feels more natural. The hero also feels empty with just a title and subtitle.
Output: Updated HeroSection with richer content, GradingPage with scroll-based collapse logic.
</objective>

<execution_context>
@/Users/matthewgardner/.claude/get-shit-done/workflows/execute-plan.md
@/Users/matthewgardner/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/components/grading/HeroSection.tsx
@src/pages/GradingPage.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Enrich HeroSection content</name>
  <files>src/components/grading/HeroSection.tsx</files>
  <action>
Redesign HeroSection to feel more engaging and informative. Keep the "EssayGrader" title and subtitle, but add content below:

1. Add 3 compact feature pills/badges in a horizontal row beneath the subtitle. Use lucide-react icons. Suggestions:
   - Zap icon + "Instant AI Feedback"
   - FileText icon + "Rubric-Aligned Scoring"
   - Sparkles icon + "Highlighted Passages"

2. Style: Use a flex row with gap-4, each pill is a flex items-center gap-1.5 with text-sm text-muted-foreground. Icons sized h-4 w-4. Add mt-6 spacing from subtitle.

3. Keep the component stateless with no props. Keep the existing py-12 text-center wrapper. Do NOT touch any header/nav branding.
  </action>
  <verify>
    <automated>cd /Users/matthewgardner/essay-grader && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>HeroSection renders title, subtitle, and 3 feature pills with icons. No TypeScript errors.</done>
</task>

<task type="auto">
  <name>Task 2: Replace focus-collapse with scroll-collapse logic</name>
  <files>src/pages/GradingPage.tsx</files>
  <action>
Replace the textarea-focus hero collapse with scroll-based collapse:

1. Remove the `handleEssayFocus` callback entirely.
2. Remove the `onFocus={handleEssayFocus}` prop from `<EssayInput>`. The `onFocus` prop is optional on EssayInput so removing it is safe.
3. Add a `useEffect` that listens to `window` scroll events:
   - On scroll, if `window.scrollY > 50` (user scrolled down past threshold), set `heroCollapsed(true)`.
   - Do NOT set it back to false on scroll up -- once collapsed, it stays collapsed.
   - Since it only ever sets true (never false), the check is: `if (!heroCollapsed && window.scrollY > 50)`.
   - Use passive event listener for performance: `{ passive: true }`.
   - Clean up the listener on unmount.
4. Keep the existing `heroCollapsed` state initialization (`essayText !== ""`), the AnimatePresence animation, and the `handleReset` function that sets heroCollapsed back to false.
5. Import `useEffect` (already imported via `useState, useCallback` line -- add `useEffect` to that import).
6. The `useCallback` import can be removed since `handleEssayFocus` is deleted (check if anything else uses useCallback -- nothing does).

The scroll listener should be structured as:
```typescript
useEffect(() => {
  if (heroCollapsed) return; // Already collapsed, no need to listen

  function onScroll() {
    if (window.scrollY > 50) {
      setHeroCollapsed(true);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}, [heroCollapsed]);
```
  </action>
  <verify>
    <automated>cd /Users/matthewgardner/essay-grader && npx tsc --noEmit 2>&1 | head -20 && npm run build 2>&1 | tail -5</automated>
  </verify>
  <done>Hero collapses on scroll down past 50px threshold. Hero stays collapsed on scroll up. Focus on textarea no longer collapses hero. Build succeeds with no errors.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with no errors
2. `npm run build` succeeds
3. Manual: Load grading page, see enriched hero with feature pills, scroll down, hero collapses, scroll back up, hero stays collapsed
</verification>

<success_criteria>
- Hero displays title, subtitle, and 3 feature pills with icons
- Scrolling down past ~50px collapses the hero with existing animation
- Hero remains collapsed after scrolling back up
- "Grade Another" reset still restores the hero
- No TypeScript or build errors
</success_criteria>

<output>
After completion, create `.planning/quick/1-scroll-dismissable-hero-with-richer-cont/1-SUMMARY.md`
</output>
