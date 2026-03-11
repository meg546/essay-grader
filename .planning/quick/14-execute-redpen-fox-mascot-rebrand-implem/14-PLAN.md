---
phase: 14-execute-redpen-fox-mascot-rebrand-implem
plan: 01-06
type: execute
wave: 1-4
depends_on: []
files_modified:
  # Plan 01 (Chunk 1 - Rebrand)
  - src/index.css
  - index.html
  - src/components/layout/LandingLayout.tsx
  - src/components/layout/Header.tsx
  - src/components/landing/HeroSection.tsx
  - src/components/landing/FeatureHighlights.tsx
  - src/components/landing/HowItWorks.tsx
  - src/components/landing/Footer.tsx
  # Plan 02 (Chunk 2 - Fox Foundation)
  - src/components/mascot/fox-states.ts
  - src/stores/fox-store.ts
  - src/components/mascot/sprites/FoxBase.tsx
  - src/components/mascot/sprites/index.ts
  - src/components/mascot/FoxAnimation.tsx
  # Plan 03 (Chunk 3 - Speech Bubble + Container)
  - src/components/mascot/SpeechBubble.tsx
  - src/components/mascot/FoxCompanion.tsx
  - src/App.tsx
  # Plan 04 (Chunk 4 - Reactive Behaviors)
  - src/pages/LandingPage.tsx
  - src/pages/GradingPage.tsx
  - src/pages/EssaysPage.tsx
  # Plan 05 (Chunk 5 - Backend Coaching)
  - backend/app/schemas/coach.py
  - backend/app/services/coach.py
  - backend/app/routes/coach.py
  - backend/app/main.py
  - backend/app/llm/client.py
  - backend/app/llm/anthropic.py
  - backend/app/llm/openai.py
  - backend/app/llm/ollama.py
  # Plan 06 (Chunk 6 - Frontend Coaching Integration)
  - src/api/coach.ts
  - src/components/mascot/use-fox-coach.ts
autonomous: false
requirements: [REBRAND-01]

must_haves:
  truths:
    - "App is branded as Redpen with warm red accent everywhere"
    - "Fox mascot is visible in bottom-right corner on all pages"
    - "Fox reacts to user actions (typing, submitting, navigating)"
    - "Clicking the fox shows LLM-powered coaching tips"
    - "Speech bubble auto-dismisses and is accessible"
  artifacts:
    - path: "src/index.css"
      provides: "Warm red color theme (hue 25)"
    - path: "src/components/mascot/FoxCompanion.tsx"
      provides: "Main fox container mounted at app root"
    - path: "src/stores/fox-store.ts"
      provides: "Zustand store for fox state management"
    - path: "backend/app/routes/coach.py"
      provides: "POST /api/coach endpoint"
    - path: "src/components/mascot/use-fox-coach.ts"
      provides: "Frontend coaching hook with debounce"
  key_links:
    - from: "src/components/mascot/FoxCompanion.tsx"
      to: "src/stores/fox-store.ts"
      via: "useFoxStore hook"
    - from: "src/components/mascot/use-fox-coach.ts"
      to: "backend/app/routes/coach.py"
      via: "POST /api/coach"
    - from: "src/pages/GradingPage.tsx"
      to: "src/stores/fox-store.ts"
      via: "setFoxState on typing/submit/results"
---

<objective>
Execute the Redpen fox mascot rebrand implementation plan. This covers rebranding from EssayGrader to Redpen (warm red theme), then building a reactive fox mascot companion with LLM-powered coaching tips.

Purpose: Transform app identity and add an engaging mascot that provides contextual writing tips.
Output: Fully rebranded app with interactive fox mascot on all pages.

**Master plan reference:** `docs/superpowers/plans/2026-03-11-redpen-fox-mascot.md`
</objective>

<execution_context>
@docs/superpowers/plans/2026-03-11-redpen-fox-mascot.md
</execution_context>

<context>
@docs/superpowers/plans/2026-03-11-redpen-fox-mascot.md
@docs/superpowers/specs/2026-03-11-redpen-fox-mascot-design.md
</context>

<tasks>

<!-- ============================================================ -->
<!-- PLAN 01: Chunk 1 — Phase A Rebrand (Tasks 1-6 from master plan) -->
<!-- Wave 1 — no dependencies -->
<!-- ============================================================ -->

<task type="auto">
  <name>Plan 01 / Task 1: Rebrand colors and meta tags (Master Tasks 1-2)</name>
  <files>src/index.css, index.html</files>
  <action>
Follow master plan Tasks 1-2 exactly:

**Task 1 — Color theme:** In `src/index.css`, change all sage green variables (hue `145`) to warm red (hue `25`) in both `:root` and `.dark` blocks. Use the exact oklch values from the master plan. Leave chart-2 (hue 160), chart-3 (hue 130), chart-4 (hue 80) unchanged.

**Task 2 — HTML meta:** In `index.html`, change `<title>` from `EssayGrader` to `Redpen`. Update meta description and theme-color if present.

Commit each separately per master plan commit messages.
  </action>
  <verify>
    <automated>grep -c "hue 145\|oklch.*145" src/index.css | grep -q "^0$" && grep -q "Redpen" index.html && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <done>All primary colors use hue 25 in both light/dark mode. Page title says "Redpen".</done>
</task>

<task type="auto">
  <name>Plan 01 / Task 2: Rebrand all component copy (Master Tasks 3-6)</name>
  <files>src/components/layout/LandingLayout.tsx, src/components/layout/Header.tsx, src/components/landing/HeroSection.tsx, src/components/landing/FeatureHighlights.tsx, src/components/landing/HowItWorks.tsx, src/components/landing/Footer.tsx</files>
  <action>
Follow master plan Tasks 3-6:

**Task 3 — LandingLayout:** Replace `GraduationCapIcon` with `PenToolIcon` (lucide-react), replace "EssayGrader" text with "Redpen" in both desktop and mobile instances.

**Task 4 — Header:** Same pattern as Task 3 for the authenticated header.

**Task 5 — Landing page copy:** Replace all "EssayGrader" references in HeroSection, FeatureHighlights, HowItWorks, and Footer with "Redpen".

**Task 6 — Remaining references:** Run `grep -ri "essaygrader\|essay.grader\|essay grader" src/ backend/ --include="*.tsx" --include="*.ts" --include="*.py" --include="*.html"` and replace any remaining user-facing instances. Skip internal variable names.

Commit per master plan commit messages (one per task group).
  </action>
  <verify>
    <automated>grep -ri "essaygrader\|essay.grader" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v "\.git" | wc -l | grep -q "^0$" && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <done>No user-facing "EssayGrader" references remain. PenToolIcon used for brand icon.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Complete rebrand from EssayGrader to Redpen — warm red color theme and updated copy across all pages</what-built>
  <how-to-verify>
    1. Run `npm run dev`
    2. Check landing page — brand says "Redpen" with PenToolIcon, warm red accents
    3. Sign in — header says "Redpen" with PenToolIcon
    4. Toggle dark mode — red accents look correct in both themes
    5. Check page title in browser tab says "Redpen"
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues</resume-signal>
</task>

<!-- ============================================================ -->
<!-- PLAN 02: Chunk 2 — Fox Foundation (Tasks 7-10 from master plan) -->
<!-- Wave 2 — after rebrand approved -->
<!-- ============================================================ -->

<task type="auto">
  <name>Plan 02 / Task 1: Fox state types, store, and sprites (Master Tasks 7-9)</name>
  <files>src/components/mascot/fox-states.ts, src/stores/fox-store.ts, src/components/mascot/sprites/FoxBase.tsx, src/components/mascot/sprites/index.ts</files>
  <action>
Follow master plan Tasks 7-9 exactly:

**Task 7 — Fox states:** Create `src/components/mascot/fox-states.ts` with the FoxState type, TIMED_STATES map, and canTransition function. Use the exact code from the master plan.

**Task 8 — Fox store:** Create `src/stores/fox-store.ts` following existing store patterns (app-store.ts, profile-store.ts). Implement persist middleware with partialize for isHidden only. Use exact code from master plan.

**Task 9 — Fox SVG sprites:** Create `src/components/mascot/sprites/FoxBase.tsx` with the consolidated SVG component (intentional deviation from spec — single component with expression props instead of per-state files). Create barrel export in `sprites/index.ts`.

Commit each task separately per master plan commit messages.
  </action>
  <verify>
    <automated>cd /Users/matthewgardner/essay-grader && npx tsc --noEmit 2>&1 | tail -5</automated>
  </verify>
  <done>Fox state types, Zustand store, and SVG sprite component all compile cleanly.</done>
</task>

<task type="auto">
  <name>Plan 02 / Task 2: Fox animation wrapper (Master Task 10)</name>
  <files>src/components/mascot/FoxAnimation.tsx</files>
  <action>
Follow master plan Task 10:

Create `src/components/mascot/FoxAnimation.tsx` using motion/react AnimatePresence with mode="wait". Include prefers-reduced-motion check — render static FoxBase if reduced motion is preferred. Use exact code from master plan.

Commit per master plan.
  </action>
  <verify>
    <automated>cd /Users/matthewgardner/essay-grader && npx tsc --noEmit 2>&1 | tail -5</automated>
  </verify>
  <done>FoxAnimation component compiles and handles both animated and reduced-motion modes.</done>
</task>

<!-- ============================================================ -->
<!-- PLAN 03: Chunk 3 — Speech Bubble + Container (Tasks 11-13) -->
<!-- Wave 2 — can run after Plan 02 tasks -->
<!-- ============================================================ -->

<task type="auto">
  <name>Plan 03 / Task 1: Speech bubble and FoxCompanion container (Master Tasks 11-12)</name>
  <files>src/components/mascot/SpeechBubble.tsx, src/components/mascot/FoxCompanion.tsx</files>
  <action>
Follow master plan Tasks 11-12:

**Task 11 — SpeechBubble:** Create `src/components/mascot/SpeechBubble.tsx` with auto-dismiss (10s), focus pause, Escape dismiss, aria-live="polite", and CSS tail triangle. Use exact code from master plan.

**Task 12 — FoxCompanion:** Create `src/components/mascot/FoxCompanion.tsx` as memo'd container. Fixed bottom-4 right-4 z-40 positioning. Includes click handler with placeholder coaching tip for now. Uses SpeechBubble and FoxAnimation. Use exact code from master plan.

Commit each separately per master plan.
  </action>
  <verify>
    <automated>cd /Users/matthewgardner/essay-grader && npx tsc --noEmit 2>&1 | tail -5</automated>
  </verify>
  <done>SpeechBubble and FoxCompanion components compile cleanly.</done>
</task>

<task type="auto">
  <name>Plan 03 / Task 2: Mount FoxCompanion in App.tsx (Master Task 13)</name>
  <files>src/App.tsx</files>
  <action>
Follow master plan Task 13:

Import FoxCompanion and render it inside BrowserRouter after Routes closing tag but before BrowserRouter closing tag. This ensures fox is visible on every page with router context available.

Commit per master plan.
  </action>
  <verify>
    <automated>cd /Users/matthewgardner/essay-grader && grep -q "FoxCompanion" src/App.tsx && npx tsc --noEmit 2>&1 | tail -5</automated>
  </verify>
  <done>Fox mascot visible in bottom-right corner on all pages.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Fox mascot foundation — SVG sprite with animation, speech bubble, mounted at app root</what-built>
  <how-to-verify>
    1. Run `npm run dev`
    2. See fox in bottom-right corner on landing page
    3. Click the fox — speech bubble appears with placeholder text
    4. Dismiss bubble with X button or Escape key
    5. Navigate between pages — fox stays visible
    6. Check both light and dark mode
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues</resume-signal>
</task>

<!-- ============================================================ -->
<!-- PLAN 04: Chunk 4 — Reactive Behaviors (Tasks 14-17) -->
<!-- Wave 3 — after fox is mounted -->
<!-- ============================================================ -->

<task type="auto">
  <name>Plan 04 / Task 1: Page-based fox state triggers (Master Tasks 14-16)</name>
  <files>src/pages/LandingPage.tsx, src/pages/GradingPage.tsx, src/pages/EssaysPage.tsx</files>
  <action>
Follow master plan Tasks 14-16:

**Task 14 — LandingPage:** Set fox to "waving" on mount, reset to "idle" on cleanup. Use exact useEffect pattern from master plan.

**Task 15 — GradingPage:** Add typing detection (fox goes "attentive" on typing, returns to "idle" after 30s timeout). Set fox to "thinking" on submit. After results: "celebrating" if >80%, "encouraging" if <60%, "attentive" for 60-80%. Add timeout cleanup on unmount. Use exact code from master plan.

**Task 16 — EssaysPage:** Set fox to "browsing" on mount, reset to "idle" on cleanup.

Commit each separately per master plan.
  </action>
  <verify>
    <automated>cd /Users/matthewgardner/essay-grader && npx tsc --noEmit 2>&1 | tail -5</automated>
  </verify>
  <done>Fox reacts to page navigation and grading workflow actions.</done>
</task>

<task type="auto">
  <name>Plan 04 / Task 2: Idle/sleepy timer (Master Task 17)</name>
  <files>src/components/mascot/FoxCompanion.tsx</files>
  <action>
Follow master plan Task 17:

Add idle detection effect to FoxCompanion. After 2 minutes (120000ms) of "idle" state, transition to "sleepy". After 2 more seconds, call requestTip("idle_nudge"). Note: requestTip from useFoxCoach is not yet available — add a placeholder comment `// TODO: wire requestTip("idle_nudge") in Task 26` and structure the code so it can be easily wired up later.

Commit per master plan.
  </action>
  <verify>
    <automated>cd /Users/matthewgardner/essay-grader && grep -q "sleepy" src/components/mascot/FoxCompanion.tsx && npx tsc --noEmit 2>&1 | tail -5</automated>
  </verify>
  <done>Fox transitions to sleepy after 2 minutes of idle state.</done>
</task>

<!-- ============================================================ -->
<!-- PLAN 05: Chunk 5 — Backend Coaching Endpoint (Tasks 18-21) -->
<!-- Wave 3 — can run parallel with Plan 04 (no file overlap) -->
<!-- ============================================================ -->

<task type="auto">
  <name>Plan 05 / Task 1: Coach schemas and service (Master Tasks 18-19)</name>
  <files>backend/app/schemas/coach.py, backend/app/services/coach.py</files>
  <action>
Follow master plan Tasks 18-19:

**Task 18 — Schemas:** Create `backend/app/schemas/coach.py` with CoachContext enum (5 values), CoachRequest, and CoachResponse. Follow CamelModel pattern from existing schemas.

**Task 19 — Service:** Create `backend/app/services/coach.py` with FALLBACK_MESSAGES dict, SYSTEM_PROMPT (friendly fox personality), CONTEXT_TEMPLATES, _compute_history_summary helper (queries Submission table for counts/averages/categories), and get_coaching_message function that calls LLM with fallback. Use exact code from master plan.

Commit each separately per master plan.
  </action>
  <verify>
    <automated>cd /Users/matthewgardner/essay-grader/backend && python -c "from app.schemas.coach import CoachRequest, CoachResponse; from app.services.coach import get_coaching_message; print('PASS')"</automated>
  </verify>
  <done>Coach schemas and service import cleanly.</done>
</task>

<task type="auto">
  <name>Plan 05 / Task 2: Coach route and LLM plain text support (Master Tasks 20-21)</name>
  <files>backend/app/routes/coach.py, backend/app/main.py, backend/app/llm/client.py, backend/app/llm/anthropic.py, backend/app/llm/openai.py, backend/app/llm/ollama.py</files>
  <action>
Follow master plan Tasks 20-21:

**Task 20 — Route:** Create `backend/app/routes/coach.py` with POST endpoint. Register in main.py via api_router following existing pattern (import coach alongside auth, grading, health, history).

**Task 21 — LLM plain text:** Update LLMClient Protocol in client.py to accept `json_schema: dict | None`. Update anthropic.py, openai.py, and ollama.py complete methods — add `if json_schema is None` branch that makes a standard text completion call (max_tokens=60 for coaching). Use exact patterns from master plan.

Commit each separately per master plan.
  </action>
  <verify>
    <automated>cd /Users/matthewgardner/essay-grader/backend && python -c "from app.routes.coach import router; print('PASS')"</automated>
  </verify>
  <done>POST /api/coach endpoint registered and LLM clients support plain text mode.</done>
</task>

<!-- ============================================================ -->
<!-- PLAN 06: Chunk 6 — Frontend Coaching Integration (Tasks 22-28) -->
<!-- Wave 4 — after backend (Plan 05) and reactive behaviors (Plan 04) -->
<!-- ============================================================ -->

<task type="auto">
  <name>Plan 06 / Task 1: Frontend coach API and hook (Master Tasks 22-23)</name>
  <files>src/api/coach.ts, src/components/mascot/use-fox-coach.ts</files>
  <action>
Follow master plan Tasks 22-23:

**Task 22 — API client:** Create `src/api/coach.ts` with CoachContext type, CoachResponse interface, and getCoachingTip function using apiClient.post. Use exact code from master plan.

**Task 23 — useFoxCoach hook:** Create `src/components/mascot/use-fox-coach.ts` with 30s debounce, cache map, and silent error handling. Only calls API if user isSignedIn. Use exact code from master plan.

Commit each separately per master plan.
  </action>
  <verify>
    <automated>cd /Users/matthewgardner/essay-grader && npx tsc --noEmit 2>&1 | tail -5</automated>
  </verify>
  <done>Coach API client and useFoxCoach hook compile cleanly.</done>
</task>

<task type="auto">
  <name>Plan 06 / Task 2: Wire coaching to pages and FoxCompanion (Master Tasks 24-27)</name>
  <files>src/pages/GradingPage.tsx, src/pages/EssaysPage.tsx, src/components/mascot/FoxCompanion.tsx</files>
  <action>
Follow master plan Tasks 24-27:

**Task 24 — GradingPage coaching:** Import useFoxCoach, call requestTip("results_received", result.id) after grading results arrive.

**Task 25 — EssaysPage coaching:** Import useFoxCoach, add requestTip("history_visit") to the existing mount effect.

**Task 26 — On-demand coaching:** In FoxCompanion, replace placeholder showCoachingTip call with requestTip("on_demand") from useFoxCoach. Also wire up the idle_nudge requestTip from Task 17's TODO placeholder.

**Task 27 — Daily greeting:** In FoxCompanion, add localStorage check with "redpen-last-visit" key. On first visit of the day, call requestTip("greeting") after 1.5s delay.

Commit each separately per master plan.
  </action>
  <verify>
    <automated>cd /Users/matthewgardner/essay-grader && npx tsc --noEmit 2>&1 | tail -5</automated>
  </verify>
  <done>All coaching integrations wired — grading results, history visit, on-demand, idle nudge, and daily greeting.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Complete fox mascot with LLM-powered coaching — full integration across all pages (Master Task 28)</what-built>
  <how-to-verify>
    1. Start full stack: `docker compose up -d --build` (or npm run dev + backend)
    2. Landing page — fox is waving
    3. Sign in, go to grading page — fox is idle
    4. Start typing — fox becomes attentive
    5. Stop typing 30s — fox returns to idle
    6. Submit essay — fox shows thinking state
    7. Results arrive — fox celebrates (>80%) or encourages (<60%)
    8. Speech bubble appears with coaching tip after results
    9. Click the fox — on-demand tip appears
    10. Navigate to essays/history — fox browses, history tip appears
    11. Dismiss speech bubble with X or Escape
    12. Toggle dark mode — fox and bubble look correct in both themes
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues</resume-signal>
</task>

</tasks>

<verification>
- All "EssayGrader" references replaced with "Redpen"
- Color theme uses warm red (hue 25) in light and dark mode
- Fox mascot visible on all pages in bottom-right corner
- Fox reacts to: page navigation, typing, submitting, grading results
- Speech bubble shows LLM-powered coaching tips
- Accessibility: aria-live, keyboard dismiss, reduced motion support
- `npx tsc --noEmit` passes
- Backend `POST /api/coach` endpoint returns coaching messages
</verification>

<success_criteria>
App fully rebranded as Redpen with warm red accent. Fox mascot visible on all pages, reacting to user actions, and providing LLM-powered contextual coaching tips via speech bubbles.
</success_criteria>

<output>
After completion, create `.planning/quick/14-execute-redpen-fox-mascot-rebrand-implem/14-SUMMARY.md`
</output>
