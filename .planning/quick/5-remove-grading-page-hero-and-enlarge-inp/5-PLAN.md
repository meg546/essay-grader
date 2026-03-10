---
phase: quick
plan: 5
type: execute
wave: 1
depends_on: []
files_modified:
  - src/pages/GradingPage.tsx
  - src/components/grading/EssayInput.tsx
  - src/components/grading/RubricUpload.tsx
  - src/components/grading/HeroSection.tsx
autonomous: true
requirements: [QUICK-5]
must_haves:
  truths:
    - "Grading page loads directly into the split-pane editor layout with no hero/welcome section"
    - "Essay textarea fills most of the viewport height (not the old h-64)"
    - "Rubric panel matches the essay panel height for a balanced split-pane feel"
  artifacts:
    - path: "src/pages/GradingPage.tsx"
      provides: "Clean grading page without hero section"
    - path: "src/components/grading/EssayInput.tsx"
      provides: "Enlarged essay textarea"
    - path: "src/components/grading/RubricUpload.tsx"
      provides: "Taller rubric panel matching essay height"
  key_links:
    - from: "src/pages/GradingPage.tsx"
      to: "EssayInput, RubricUpload"
      via: "direct import, no HeroSection"
      pattern: "grid.*md:grid-cols-2"
---

<objective>
Remove the hero/welcome section from the grading page and enlarge the essay input and rubric panels to fill the freed space. The landing page now handles marketing — the grading page should be a clean, Grammarly-inspired split-pane editor layout with generous input areas.

Purpose: Authenticated users land directly in a focused editing environment.
Output: Updated GradingPage, EssayInput, RubricUpload; deleted HeroSection.
</objective>

<execution_context>
@/Users/matthewgardner/.claude/get-shit-done/workflows/execute-plan.md
@/Users/matthewgardner/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/pages/GradingPage.tsx
@src/components/grading/EssayInput.tsx
@src/components/grading/RubricUpload.tsx
@src/components/grading/HeroSection.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove hero section and restructure GradingPage layout</name>
  <files>src/pages/GradingPage.tsx, src/components/grading/HeroSection.tsx</files>
  <action>
In GradingPage.tsx:
- Remove the HeroSection import
- Remove the AnimatePresence import (only used for hero animation)
- Remove the `heroCollapsed` state and its setter
- Remove the entire useEffect that listens for scroll to collapse hero
- Remove the AnimatePresence/motion.div block wrapping HeroSection (lines 116-133)
- In handleReset, remove the `setHeroCollapsed(false)` line
- Change the outer container from `max-w-[1200px] space-y-6` to `max-w-[1400px] flex flex-col` with `h-[calc(100vh-7rem)]` to fill the viewport (leave room for navbar ~4rem + padding ~3rem)
- Change the grid div from `grid gap-6 md:grid-cols-2` to `grid gap-6 md:grid-cols-2 flex-1 min-h-0` so the two panels stretch to fill available height
- Move the Submit button into a compact bottom bar: wrap it in a `div` with `pt-4 shrink-0` so it sits below the panels without scrolling
- Remove unused `motion` import from "motion/react" if no longer used elsewhere in the file

Delete src/components/grading/HeroSection.tsx entirely.
  </action>
  <verify>
    <automated>cd /Users/matthewgardner/essay-grader && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>GradingPage renders without hero section, uses full viewport height layout. HeroSection.tsx deleted. No TypeScript errors.</done>
</task>

<task type="auto">
  <name>Task 2: Enlarge essay and rubric panels for split-pane layout</name>
  <files>src/components/grading/EssayInput.tsx, src/components/grading/RubricUpload.tsx</files>
  <action>
In EssayInput.tsx:
- Change the outer Card to include `className="flex flex-col h-full"` so it stretches to fill the grid cell
- Change CardContent to include `flex-1 flex flex-col min-h-0` (add to existing cn() call) so content fills the card
- Change the Textarea from `h-64 resize-none overflow-y-auto` to `flex-1 resize-none overflow-y-auto min-h-[200px]` so it fills all available space
- Wrap the Textarea's parent drag-drop div with `flex-1 flex flex-col min-h-0` so the textarea can grow
- Keep the upload button and word count below the textarea as-is (they're already compact)

In RubricUpload.tsx:
- Change the outer Card to include `className="flex flex-col h-full"` to match essay panel height
- Change CardContent to include `flex-1 flex flex-col` (add to existing cn() call)
- For the empty-state drop zone (the dashed border div), change from `p-8` to `flex-1 p-8` so it fills the available card space, creating a large drop target
- For the file-uploaded state, add `flex-1 flex flex-col justify-center` so the file info is vertically centered in the tall panel
  </action>
  <verify>
    <automated>cd /Users/matthewgardner/essay-grader && npx tsc --noEmit 2>&1 | head -30 && npm run build 2>&1 | tail -5</automated>
  </verify>
  <done>Both panels stretch to fill viewport height. Essay textarea is tall and generous. Rubric drop zone fills its panel. Build succeeds with no errors.</done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes with no errors
- `npm run build` succeeds
- No references to HeroSection remain in the codebase
- GradingPage fills the viewport with a clean split-pane layout
</verification>

<success_criteria>
- Hero section completely removed from grading page
- HeroSection.tsx file deleted
- Essay textarea fills most of the left panel height (not fixed h-64)
- Rubric panel matches essay panel height
- Submit button accessible below the panels
- No scroll needed to see the full input area on a standard viewport
</success_criteria>

<output>
After completion, create `.planning/quick/5-remove-grading-page-hero-and-enlarge-inp/5-SUMMARY.md`
</output>
