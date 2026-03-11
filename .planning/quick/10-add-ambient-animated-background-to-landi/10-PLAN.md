---
phase: quick-10
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/landing/AmbientBackground.tsx
  - src/pages/LandingPage.tsx
autonomous: true
requirements: [QUICK-10]
must_haves:
  truths:
    - "Landing page shows subtle animated gradient orbs drifting in background"
    - "Essay-related floating words are barely visible and drift slowly"
    - "Animations are hidden when user prefers reduced motion"
    - "Background does not interfere with page interaction (pointer-events-none)"
  artifacts:
    - path: "src/components/landing/AmbientBackground.tsx"
      provides: "Ambient animated background with gradient orbs and floating words"
      min_lines: 40
    - path: "src/pages/LandingPage.tsx"
      provides: "Landing page with AmbientBackground rendered as first child"
  key_links:
    - from: "src/pages/LandingPage.tsx"
      to: "src/components/landing/AmbientBackground.tsx"
      via: "import and render before HeroSection"
      pattern: "<AmbientBackground"
---

<objective>
Add an ambient animated background to the landing page with slowly drifting gradient orbs and faintly visible essay-related floating words.

Purpose: Gives the landing page a polished, premium feel with subtle movement that reinforces the essay-grading theme.
Output: New AmbientBackground component integrated into LandingPage.
</objective>

<execution_context>
@/Users/matthewgardner/.claude/get-shit-done/workflows/execute-plan.md
@/Users/matthewgardner/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/pages/LandingPage.tsx
@src/components/landing/HeroSection.tsx
@src/index.css

<interfaces>
<!-- From src/pages/LandingPage.tsx — current return JSX structure -->
The return block currently renders:
  <> <HeroSection .../> <FeatureHighlights /> <HowItWorks /> <WalkthroughDemo /> <Footer /> <SignInDialog .../> </>

AmbientBackground must be inserted as the very first child of the fragment, before HeroSection.

<!-- From src/index.css — primary color tokens -->
Light: --primary: oklch(0.55 0.10 145)  (sage green)
Dark:  --primary: oklch(0.60 0.10 145)

<!-- Motion import pattern (from HeroSection.tsx) -->
import { motion } from "motion/react"
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create AmbientBackground component with gradient orbs and floating words</name>
  <files>src/components/landing/AmbientBackground.tsx</files>
  <action>
Create `src/components/landing/AmbientBackground.tsx`:

1. **Wrapper div:** `fixed inset-0 -z-10 overflow-hidden pointer-events-none motion-reduce:hidden` with `aria-hidden="true"`.

2. **Gradient orbs (3 total):** Each is a `motion.div` with:
   - Size: `w-[500px] h-[500px]` to `w-[700px] h-[700px]` (vary per orb)
   - Style: `background: radial-gradient(circle, oklch(0.55 0.10 145 / 0.12), transparent 70%)` — use inline style for the oklch radial gradient since Tailwind cannot do radial-gradient with oklch natively
   - Classes: `absolute rounded-full blur-3xl`
   - Position each orb at different starting positions (e.g., top-left, center-right, bottom-left) using `top`/`left` percentages
   - Framer Motion `animate` with keyframes for `x` and `y` (e.g., `x: [0, 80, -60, 0]`, `y: [0, -50, 70, 0]`) — different per orb
   - `transition: { duration: 30-50 (vary per orb), repeat: Infinity, ease: "easeInOut" }`

3. **Floating words (8 words):** Array: `["thesis", "clarity", "structure", "evidence", "argument", "analysis", "coherence", "insight"]`. Map each to a `motion.span` with:
   - Classes: `absolute text-primary opacity-[0.08] text-sm md:text-base font-medium select-none`
   - Position: Distribute across the viewport using hardcoded `top`/`left` percentage values (spread them out, e.g., top: 10%-85%, left: 5%-90%)
   - Framer Motion `animate` with small `x` and `y` keyframe drift (e.g., `x: [0, 20, -15, 0]`, `y: [0, -25, 10, 0]`)
   - `transition: { duration: 40-55 (vary per word), repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }`

4. **Performance:** All animations use transform-only properties (x, y) for GPU acceleration. No layout-triggering properties.

Use `import { motion } from "motion/react"` (NOT `framer-motion` — this project uses the `motion` package).
  </action>
  <verify>
    <automated>cd /Users/matthewgardner/essay-grader && npx tsc --noEmit src/components/landing/AmbientBackground.tsx 2>&1 | head -20</automated>
  </verify>
  <done>AmbientBackground.tsx exists, exports the component, compiles without type errors, renders 3 gradient orbs and 8 floating words with Framer Motion animations</done>
</task>

<task type="auto">
  <name>Task 2: Integrate AmbientBackground into LandingPage</name>
  <files>src/pages/LandingPage.tsx</files>
  <action>
In `src/pages/LandingPage.tsx`:

1. Add import: `import { AmbientBackground } from "@/components/landing/AmbientBackground"`

2. In the return JSX fragment, add `<AmbientBackground />` as the very first child, before `<HeroSection>`:
   ```
   return (
     <>
       <AmbientBackground />
       <HeroSection ... />
       ...
     </>
   )
   ```

No other changes to the file.
  </action>
  <verify>
    <automated>cd /Users/matthewgardner/essay-grader && npx tsc --noEmit src/pages/LandingPage.tsx 2>&1 | head -20</automated>
  </verify>
  <done>LandingPage imports and renders AmbientBackground as its first child element, compiles without errors</done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes with no errors on both files
- `npm run build` completes successfully
- Visual check: landing page shows subtle drifting gradient orbs and faint floating words behind content
</verification>

<success_criteria>
- AmbientBackground component exists with 3 gradient orbs and 8 floating words
- All animations use Framer Motion with long durations (30-55s) and infinite repeat
- Component uses fixed positioning, -z-10, pointer-events-none, aria-hidden
- motion-reduce:hidden applied for accessibility
- LandingPage renders AmbientBackground before HeroSection
- No TypeScript errors
</success_criteria>

<output>
After completion, create `.planning/quick/10-add-ambient-animated-background-to-landi/10-SUMMARY.md`
</output>
