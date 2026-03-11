# Redpen — Rebrand & Fox Mascot Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand the app from EssayGrader to Redpen with a warm red accent theme, then add a reactive red fox mascot companion with LLM-powered coaching tips.

**Architecture:** Two-phase approach. Phase A updates branding, colors, and copy across the existing codebase. Phase B adds a new `FoxCompanion` component tree rendered at the App root, a Zustand store for fox state, and a backend `/api/coach` endpoint that calls Claude Haiku for contextual tips.

**Tech Stack:** React 19, TypeScript, Zustand 5, motion 12 (animations), Tailwind CSS v4, FastAPI, SQLAlchemy (async), Anthropic Claude API

**Spec:** `docs/superpowers/specs/2026-03-11-redpen-fox-mascot-design.md`

---

## Chunk 1: Phase A — Rebrand

### Task 1: Update color theme from sage green to warm red

**Files:**
- Modify: `src/index.css` (CSS custom properties for primary color)

The current primary color is sage green `oklch(0.55 0.10 145)`. Change it to a muted crimson/terracotta.

- [ ] **Step 1: Update light mode colors (hue 145 → 25)**

In `src/index.css`, find the `:root` block. Change all sage green variables (hue `145`) to warm red (hue `25`). The key changes:

```css
/* Primary */
--primary: oklch(0.50 0.15 25);           /* was oklch(0.55 0.10 145) */
--primary-foreground: oklch(0.98 0.005 90); /* stays same */
/* Accent */
--accent: oklch(0.92 0.03 25);            /* was oklch(0.92 0.03 145) */
--accent-foreground: oklch(0.25 0.05 25); /* was oklch(0.25 0.05 145) */
/* Ring */
--ring: oklch(0.50 0.15 25);             /* was oklch(0.55 0.10 145) */
/* Charts */
--chart-1: oklch(0.55 0.10 25);          /* was hue 145 */
--chart-5: oklch(0.45 0.10 25);          /* was hue 145 */
/* Sidebar */
--sidebar-primary: oklch(0.50 0.15 25);           /* was hue 145 */
--sidebar-primary-foreground: oklch(0.98 0.005 90); /* stays same */
--sidebar-accent: oklch(0.92 0.03 25);             /* was hue 145 */
--sidebar-accent-foreground: oklch(0.25 0.05 25);  /* was hue 145 */
--sidebar-ring: oklch(0.50 0.15 25);               /* was hue 145 */
```

Leave `--chart-2` (hue 160), `--chart-3` (hue 130), `--chart-4` (hue 80) as complementary colors.

- [ ] **Step 2: Update dark mode colors (hue 145 → 25)**

In the `.dark` block, apply the same hue shift:

```css
--primary: oklch(0.65 0.13 25);            /* was oklch(0.60 0.10 145) */
--primary-foreground: oklch(0.15 0.01 60);  /* stays same */
--accent: oklch(0.25 0.03 25);             /* was oklch(0.25 0.03 145) */
--accent-foreground: oklch(0.85 0.05 25);  /* was oklch(0.85 0.05 145) */
--ring: oklch(0.65 0.13 25);              /* was oklch(0.60 0.10 145) */
--chart-1: oklch(0.60 0.10 25);           /* was hue 145 */
--chart-5: oklch(0.50 0.10 25);           /* was hue 145 */
--sidebar-primary: oklch(0.65 0.13 25);            /* was hue 145 */
--sidebar-primary-foreground: oklch(0.15 0.01 60);  /* stays same */
--sidebar-accent: oklch(0.25 0.03 25);              /* was hue 145 */
--sidebar-accent-foreground: oklch(0.85 0.05 25);   /* was hue 145 */
--sidebar-ring: oklch(0.65 0.13 25);                /* was hue 145 */
```

- [ ] **Step 3: Verify visually**

Run: `npm run dev`

Check that buttons, active nav links, and accent elements are now a warm, muted red in both light and dark mode. Ensure it's subtle — not aggressive.

- [ ] **Step 4: Commit**

```bash
git add src/index.css
git commit -m "feat(rebrand): update primary color from sage green to muted crimson"
```

---

### Task 2: Update HTML meta tags and page title

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Update title and meta description**

Change the `<title>` from `EssayGrader` to `Redpen`. Update the meta description if present. Update theme-color meta tag if it references the old brand.

```html
<title>Redpen</title>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat(rebrand): update page title to Redpen"
```

---

### Task 3: Update landing page layout branding

**Files:**
- Modify: `src/components/layout/LandingLayout.tsx`

The current branding uses `GraduationCapIcon` + "EssayGrader" text.

- [ ] **Step 1: Replace brand name and icon**

Change the import from `GraduationCapIcon` to `PenToolIcon` (from lucide-react) and update the brand text:

```tsx
// Old
import { GraduationCapIcon, Sun, Moon, Menu } from "lucide-react";
// ...
<GraduationCapIcon className="h-6 w-6 text-primary" />
<span className="...">EssayGrader</span>

// New
import { PenToolIcon, Sun, Moon, Menu } from "lucide-react";
// ...
<PenToolIcon className="h-6 w-6 text-primary" />
<span className="...">Redpen</span>
```

Update both the desktop and mobile menu instances (there are two occurrences of the brand in this file).

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/LandingLayout.tsx
git commit -m "feat(rebrand): update landing layout branding to Redpen"
```

---

### Task 4: Update authenticated header branding

**Files:**
- Modify: `src/components/layout/Header.tsx`

Same pattern as Task 3 — the Header uses `GraduationCapIcon` + "EssayGrader" text.

- [ ] **Step 1: Replace brand name and icon**

```tsx
// Old
import { GraduationCapIcon, Sun, Moon, Menu } from "lucide-react";
// ...
<GraduationCapIcon className="h-6 w-6 text-primary" />
<span className="...">EssayGrader</span>

// New
import { PenToolIcon, Sun, Moon, Menu } from "lucide-react";
// ...
<PenToolIcon className="h-6 w-6 text-primary" />
<span className="...">Redpen</span>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/Header.tsx
git commit -m "feat(rebrand): update header branding to Redpen"
```

---

### Task 5: Update landing page copy

**Files:**
- Modify: `src/components/landing/HeroSection.tsx`
- Modify: `src/components/landing/FeatureHighlights.tsx`
- Modify: `src/components/landing/HowItWorks.tsx`
- Modify: `src/components/landing/Footer.tsx`

- [ ] **Step 1: Update HeroSection headline and copy**

Search for any occurrence of "EssayGrader" in the hero section and replace with "Redpen". Update the tagline to reflect the new brand if it references the old name.

- [ ] **Step 2: Update remaining landing components**

Search each of `FeatureHighlights.tsx`, `HowItWorks.tsx`, and `Footer.tsx` for "EssayGrader" references and replace with "Redpen".

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/
git commit -m "feat(rebrand): update landing page copy to Redpen"
```

---

### Task 6: Update any remaining references

**Files:**
- Search across: `src/` and `backend/`

- [ ] **Step 1: Search for remaining "EssayGrader" references**

Run: `grep -ri "essaygrader\|essay.grader\|essay grader" src/ backend/ --include="*.tsx" --include="*.ts" --include="*.py" --include="*.html"`

Replace any remaining user-facing instances with "Redpen". Skip comments and internal variable names that don't affect the UI.

- [ ] **Step 2: Commit if any changes found**

Stage only the specific files that were changed (avoid `git add -A` which may stage unrelated files):

```bash
git add <changed-files>
git commit -m "feat(rebrand): replace remaining EssayGrader references with Redpen"
```

---

## Chunk 2: Phase B — Fox Mascot Foundation (Store + States + Sprites)

### Task 7: Create fox state types and transition logic

**Files:**
- Create: `src/components/mascot/fox-states.ts`

- [ ] **Step 1: Define fox state enum and transitions**

```typescript
export type FoxState =
  | "idle"
  | "attentive"
  | "thinking"
  | "celebrating"
  | "encouraging"
  | "coaching"
  | "sleepy"
  | "browsing"
  | "waving";

/** States that auto-transition back to idle after a duration */
export const TIMED_STATES: Partial<Record<FoxState, number>> = {
  celebrating: 3000,
  encouraging: 3000,
};

/** Whether a state can be interrupted by a new state */
export function canTransition(from: FoxState, to: FoxState): boolean {
  // Thinking can only be interrupted by result states
  if (from === "thinking") {
    return ["celebrating", "encouraging", "coaching", "idle"].includes(to);
  }
  return true;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/mascot/fox-states.ts
git commit -m "feat(mascot): add fox state types and transition logic"
```

---

### Task 8: Create Zustand fox store

**Files:**
- Create: `src/stores/fox-store.ts`

- [ ] **Step 1: Create the fox store**

Follow the same pattern as `app-store.ts` and `profile-store.ts`:

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FoxState } from "@/components/mascot/fox-states";
import { canTransition, TIMED_STATES } from "@/components/mascot/fox-states";

interface FoxStore {
  currentState: FoxState;
  speechBubbleText: string;
  isBubbleVisible: boolean;
  isHidden: boolean;
  setFoxState: (state: FoxState) => void;
  showCoachingTip: (text: string) => void;
  dismissBubble: () => void;
  toggleHidden: () => void;
}

export const useFoxStore = create<FoxStore>()(
  persist(
    (set, get) => ({
      currentState: "idle" as FoxState,
      speechBubbleText: "",
      isBubbleVisible: false,
      isHidden: false,

      setFoxState: (state) => {
        const current = get().currentState;
        if (canTransition(current, state)) {
          set({ currentState: state });

          // Auto-transition back to idle for timed states
          const duration = TIMED_STATES[state];
          if (duration) {
            setTimeout(() => {
              if (get().currentState === state) {
                set({ currentState: "idle" });
              }
            }, duration);
          }
        }
      },

      showCoachingTip: (text) => {
        set({
          speechBubbleText: text,
          isBubbleVisible: true,
          currentState: "coaching",
        });
      },

      dismissBubble: () => {
        set({ isBubbleVisible: false, currentState: "idle" });
      },

      toggleHidden: () => {
        set((s) => ({ isHidden: !s.isHidden }));
      },
    }),
    {
      name: "fox-store",
      version: 1,
      partialize: (state) => ({ isHidden: state.isHidden }),
    }
  )
);
```

- [ ] **Step 2: Commit**

```bash
git add src/stores/fox-store.ts
git commit -m "feat(mascot): add Zustand fox store with state management"
```

---

### Task 9: Create placeholder fox SVG sprites

**Files:**
- Create: `src/components/mascot/sprites/FoxBase.tsx`
- Create: `src/components/mascot/sprites/index.ts`

We create a single base fox SVG component with expression props rather than 9 separate files. This keeps things DRY — the poses are simple variations of the same fox shape (different eyes, ears, tail positions).

> **Intentional deviation from spec:** The spec defines one file per state (`FoxIdle.tsx`, `FoxAttentive.tsx`, etc.). We consolidate into a single `FoxBase.tsx` since the placeholder art shares the same base shape with expression variations. When designer artwork replaces these placeholders, the per-state file structure from the spec should be revisited.

- [ ] **Step 1: Create the base fox SVG component**

```tsx
// src/components/mascot/sprites/FoxBase.tsx
import type { FoxState } from "../fox-states";

interface FoxBaseProps {
  state: FoxState;
  className?: string;
}

/**
 * Placeholder fox SVG — a simple rounded fox shape with expressions.
 * Replace with designer artwork or Lottie animations later.
 */
export function FoxBase({ state, className }: FoxBaseProps) {
  const eyeVariants: Record<FoxState, { leftEye: string; rightEye: string }> = {
    idle: { leftEye: "open", rightEye: "open" },
    attentive: { leftEye: "wide", rightEye: "wide" },
    thinking: { leftEye: "squint", rightEye: "open" },
    celebrating: { leftEye: "happy", rightEye: "happy" },
    encouraging: { leftEye: "soft", rightEye: "soft" },
    coaching: { leftEye: "open", rightEye: "open" },
    sleepy: { leftEye: "closed", rightEye: "closed" },
    browsing: { leftEye: "open", rightEye: "down" },
    waving: { leftEye: "happy", rightEye: "happy" },
  };

  const eyes = eyeVariants[state];

  // Simple rounded fox face SVG
  return (
    <svg
      viewBox="0 0 80 80"
      className={className}
      role="img"
      aria-label={`Fox mascot — ${state}`}
    >
      {/* Ears */}
      <polygon points="15,30 25,5 35,28" fill="#D4652A" />
      <polygon points="45,28 55,5 65,30" fill="#D4652A" />
      <polygon points="19,28 25,12 31,27" fill="#F5C5A3" />
      <polygon points="49,27 55,12 61,28" fill="#F5C5A3" />

      {/* Head */}
      <ellipse cx="40" cy="45" rx="28" ry="25" fill="#E27D3A" />

      {/* Chest/cheeks */}
      <ellipse cx="40" cy="55" rx="18" ry="15" fill="#FBE8D3" />

      {/* Eyes */}
      <g>
        {eyes.leftEye === "closed" || eyes.leftEye === "happy" ? (
          <path
            d={eyes.leftEye === "happy" ? "M28,40 Q32,36 36,40" : "M28,40 L36,40"}
            stroke="#2D1B0E"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        ) : (
          <ellipse
            cx="32"
            cy="40"
            rx={eyes.leftEye === "wide" ? 4 : eyes.leftEye === "squint" ? 3 : 3.5}
            ry={eyes.leftEye === "wide" ? 5 : eyes.leftEye === "squint" ? 2 : 4}
            fill="#2D1B0E"
          />
        )}
        {eyes.rightEye === "closed" || eyes.rightEye === "happy" ? (
          <path
            d={eyes.rightEye === "happy" ? "M44,40 Q48,36 52,40" : "M44,40 L52,40"}
            stroke="#2D1B0E"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        ) : (
          <ellipse
            cx="48"
            cy={eyes.rightEye === "down" ? 42 : 40}
            rx={eyes.rightEye === "wide" ? 4 : 3.5}
            ry={eyes.rightEye === "wide" ? 5 : eyes.rightEye === "soft" ? 3 : 4}
            fill="#2D1B0E"
          />
        )}
      </g>

      {/* Nose */}
      <ellipse cx="40" cy="48" rx="3" ry="2" fill="#2D1B0E" />

      {/* Mouth — varies by state */}
      {(state === "celebrating" || state === "waving") && (
        <path d="M36,52 Q40,57 44,52" stroke="#2D1B0E" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      )}
      {state === "encouraging" && (
        <path d="M37,53 Q40,55 43,53" stroke="#2D1B0E" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      )}

      {/* Tail — right side */}
      <path
        d={
          state === "celebrating"
            ? "M65,55 Q78,40 72,28"
            : state === "sleepy"
              ? "M55,62 Q65,65 68,60"
              : "M65,55 Q75,45 70,35"
        }
        stroke="#D4652A"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />

      {/* Waving paw */}
      {state === "waving" && (
        <ellipse cx="18" cy="30" rx="5" ry="4" fill="#E27D3A" />
      )}

      {/* Sparkles for celebrating */}
      {state === "celebrating" && (
        <>
          <circle cx="15" cy="25" r="2" fill="#FFD700" />
          <circle cx="65" cy="20" r="1.5" fill="#FFD700" />
          <circle cx="10" cy="45" r="1.5" fill="#FFD700" />
        </>
      )}
    </svg>
  );
}
```

- [ ] **Step 2: Create index barrel export**

```typescript
// src/components/mascot/sprites/index.ts
export { FoxBase } from "./FoxBase";
```

- [ ] **Step 3: Commit**

```bash
git add src/components/mascot/sprites/
git commit -m "feat(mascot): add placeholder fox SVG sprite component"
```

---

### Task 10: Create FoxAnimation component with motion transitions

**Files:**
- Create: `src/components/mascot/FoxAnimation.tsx`

- [ ] **Step 1: Create the animation wrapper**

```tsx
import { AnimatePresence, motion } from "motion/react";
import { useFoxStore } from "@/stores/fox-store";
import { FoxBase } from "./sprites";

const motionConfig = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { duration: 0.3 },
};

export function FoxAnimation() {
  const currentState = useFoxStore((s) => s.currentState);

  // Check reduced motion preference
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    return <FoxBase state={currentState} className="h-20 w-20" />;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div key={currentState} {...motionConfig}>
        <FoxBase state={currentState} className="h-20 w-20" />
      </motion.div>
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/mascot/FoxAnimation.tsx
git commit -m "feat(mascot): add FoxAnimation with motion transitions"
```

---

## Chunk 3: Phase B — Speech Bubble + FoxCompanion Container

### Task 11: Create SpeechBubble component

**Files:**
- Create: `src/components/mascot/SpeechBubble.tsx`

- [ ] **Step 1: Create the speech bubble**

```tsx
import { useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useFoxStore } from "@/stores/fox-store";

const AUTO_DISMISS_MS = 10_000;

export function SpeechBubble() {
  const text = useFoxStore((s) => s.speechBubbleText);
  const isVisible = useFoxStore((s) => s.isBubbleVisible);
  const dismiss = useFoxStore((s) => s.dismissBubble);

  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const hasFocusRef = useRef(false);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (!hasFocusRef.current) dismiss();
    }, AUTO_DISMISS_MS);
  }, [dismiss]);

  useEffect(() => {
    if (isVisible) startTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isVisible, startTimer]);

  const handleFocus = () => {
    hasFocusRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleBlur = () => {
    hasFocusRef.current = false;
    if (isVisible) startTimer();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") dismiss();
  };

  return (
    <AnimatePresence>
      {isVisible && text && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          role="status"
          aria-live="polite"
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          className="absolute bottom-full mb-2 right-0 max-w-[250px] rounded-xl bg-popover border border-border p-3 shadow-lg text-sm text-popover-foreground"
        >
          <button
            onClick={dismiss}
            aria-label="Dismiss tip"
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
          <p>{text}</p>
          {/* Tail pointing down */}
          <div className="absolute -bottom-2 right-6 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-popover" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/mascot/SpeechBubble.tsx
git commit -m "feat(mascot): add SpeechBubble component with auto-dismiss and a11y"
```

---

### Task 12: Create FoxCompanion container

**Files:**
- Create: `src/components/mascot/FoxCompanion.tsx`

- [ ] **Step 1: Create the main container**

```tsx
import { memo } from "react";
import { useFoxStore } from "@/stores/fox-store";
import { FoxAnimation } from "./FoxAnimation";
import { SpeechBubble } from "./SpeechBubble";

export const FoxCompanion = memo(function FoxCompanion() {
  const isHidden = useFoxStore((s) => s.isHidden);
  const isBubbleVisible = useFoxStore((s) => s.isBubbleVisible);
  const dismissBubble = useFoxStore((s) => s.dismissBubble);
  const showCoachingTip = useFoxStore((s) => s.showCoachingTip);

  if (isHidden) return null;

  const handleClick = () => {
    if (isBubbleVisible) {
      dismissBubble();
    } else {
      // On-demand coaching will be wired up in the coaching task
      // For now, clicking toggles a placeholder message
      showCoachingTip("Click me after grading for personalized tips!");
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="relative">
        <SpeechBubble />
        <button
          onClick={handleClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleClick();
            }
          }}
          aria-label="Fox companion — click for writing tips"
          className="block cursor-pointer rounded-full p-1 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <FoxAnimation />
        </button>
      </div>
    </div>
  );
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/mascot/FoxCompanion.tsx
git commit -m "feat(mascot): add FoxCompanion container with click interaction"
```

---

### Task 13: Mount FoxCompanion in App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Import and render FoxCompanion**

Add the import at the top of `App.tsx`:
```tsx
import { FoxCompanion } from "@/components/mascot/FoxCompanion";
```

Render it **inside** the `<BrowserRouter>` but **after** `</Routes>`, so the fox is visible on every page and has access to router context (e.g., `useLocation`) for future extensibility. The current App structure is:

```tsx
export default function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* ... routes ... */}
        </Routes>
        <FoxCompanion />
      </BrowserRouter>
      <Toaster />
    </>
  )
}
```

Place `<FoxCompanion />` after `</Routes>` but before `</BrowserRouter>`.

- [ ] **Step 2: Verify visually**

Run: `npm run dev`

Verify the fox appears in the bottom-right corner on:
- Landing page (unauthenticated)
- Grading page (authenticated)
- History page
- Profile page

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat(mascot): mount FoxCompanion at app root level"
```

---

## Chunk 4: Phase B — Reactive Behaviors (Page Triggers)

### Task 14: Add fox state triggers to LandingPage

**Files:**
- Modify: `src/pages/LandingPage.tsx`

- [ ] **Step 1: Set fox to waving on mount**

Add at the top of the `LandingPage` component:

```tsx
import { useFoxStore } from "@/stores/fox-store";

// Inside the component:
const setFoxState = useFoxStore((s) => s.setFoxState);

useEffect(() => {
  setFoxState("waving");
  return () => setFoxState("idle");
}, [setFoxState]);
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/LandingPage.tsx
git commit -m "feat(mascot): fox waves on landing page"
```

---

### Task 15: Add fox state triggers to GradingPage

**Files:**
- Modify: `src/pages/GradingPage.tsx`

- [ ] **Step 1: Add typing detection**

Import the fox store and add a typing timeout ref:

```tsx
import { useFoxStore } from "@/stores/fox-store";

// Inside the component:
const setFoxState = useFoxStore((s) => s.setFoxState);
const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
```

- [ ] **Step 2: Wire up typing detection to essay input handler**

Find the existing `essayText` change handler (or `setEssayText` calls). Wrap it to also notify the fox:

```tsx
function handleEssayChange(text: string) {
  setEssayText(text);

  // Fox reacts to typing
  setFoxState("attentive");
  if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  typingTimeoutRef.current = setTimeout(() => {
    setFoxState("idle");
  }, 30_000);
}
```

Replace direct `setEssayText` calls in the textarea `onChange` with `handleEssayChange`.

- [ ] **Step 3: Set fox to thinking on submit**

In the submit handler (where `gradeEssay` is called), add before the API call:

```tsx
setFoxState("thinking");
```

- [ ] **Step 4: Set fox reaction on results**

After `gradeEssay` resolves and `setCurrentResult` is called, add:

```tsx
const percentage = (result.overallScore / result.maxScore) * 100;
if (percentage > 80) {
  setFoxState("celebrating");
} else if (percentage < 60) {
  setFoxState("encouraging");
} else {
  setFoxState("attentive"); // 60-80% range per spec
}
```

- [ ] **Step 5: Cleanup timeout on unmount**

```tsx
useEffect(() => {
  return () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };
}, []);
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/GradingPage.tsx
git commit -m "feat(mascot): fox reacts to typing, submitting, and grading results"
```

---

### Task 16: Add fox state triggers to EssaysPage

**Files:**
- Modify: `src/pages/EssaysPage.tsx`

- [ ] **Step 1: Set fox to browsing on mount**

```tsx
import { useFoxStore } from "@/stores/fox-store";

// Inside the component:
const setFoxState = useFoxStore((s) => s.setFoxState);

useEffect(() => {
  setFoxState("browsing");
  return () => setFoxState("idle");
}, [setFoxState]);
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/EssaysPage.tsx
git commit -m "feat(mascot): fox browses on history page"
```

---

### Task 17: Add idle/sleepy timer

**Files:**
- Modify: `src/components/mascot/FoxCompanion.tsx`

- [ ] **Step 1: Add idle detection**

Inside `FoxCompanion`, add an effect that watches for 2 minutes of idle state and transitions to sleepy, then nudges with a coaching tip. Note: `requestTip` from `useFoxCoach` will be added in Task 26 — this task adds the idle timer structure and the `requestTip` call will work once Task 26 lands. If implementing in order, use a placeholder comment for `requestTip` and wire it up in Task 26.

```tsx
import { useEffect, useRef } from "react";

// Inside the component, before the return:
const currentState = useFoxStore((s) => s.currentState);
const setFoxState = useFoxStore((s) => s.setFoxState);
const idleTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

useEffect(() => {
  if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

  if (currentState === "idle") {
    idleTimerRef.current = setTimeout(() => {
      setFoxState("sleepy");
      // Nudge with a coaching tip after going sleepy (per spec)
      setTimeout(() => requestTip("idle_nudge"), 2000);
    }, 120_000); // 2 minutes
  }

  return () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
  };
}, [currentState, setFoxState]);
```

- [ ] **Step 2: Commit**

```bash
git add src/components/mascot/FoxCompanion.tsx
git commit -m "feat(mascot): fox falls asleep after 2 minutes idle"
```

---

## Chunk 5: Phase B — Backend Coaching Endpoint

### Task 18: Create coach Pydantic schemas

**Files:**
- Create: `backend/app/schemas/coach.py`

- [ ] **Step 1: Define request and response schemas**

Follow the same pattern as `backend/app/schemas/grading.py` (uses CamelModel base):

```python
from enum import Enum
from typing import Optional
from uuid import UUID

from app.schemas.base import CamelModel


class CoachContext(str, Enum):
    RESULTS_RECEIVED = "results_received"
    IDLE_NUDGE = "idle_nudge"
    HISTORY_VISIT = "history_visit"
    ON_DEMAND = "on_demand"
    GREETING = "greeting"


class CoachRequest(CamelModel):
    context: CoachContext
    submission_id: Optional[UUID] = None


class CoachResponse(CamelModel):
    message: str
    fox_state: str = "coaching"
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/schemas/coach.py
git commit -m "feat(mascot): add coach request/response schemas"
```

---

### Task 19: Create coach service

**Files:**
- Create: `backend/app/services/coach.py`

- [ ] **Step 1: Create the CoachService**

```python
import logging
from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.llm.client import get_llm_client
from app.config import get_settings
from app.models.submission import Submission
from app.schemas.coach import CoachContext

logger = logging.getLogger(__name__)

FALLBACK_MESSAGES = {
    CoachContext.RESULTS_RECEIVED: "Nice work submitting that essay! Keep writing and improving.",
    CoachContext.IDLE_NUDGE: "Ready to write? Every essay is a chance to get better!",
    CoachContext.HISTORY_VISIT: "Looking back at your work? That's a great habit!",
    CoachContext.ON_DEMAND: "Need a tip? Try reading your essay out loud — you'll catch things you missed.",
    CoachContext.GREETING: "Hey there! Ready to write something great today?",
}

SYSTEM_PROMPT = """You are a friendly red fox mascot named Redpen who lives inside a writing app. You give short, personalized writing tips and encouragement.

Personality:
- Friendly, slightly cheeky, always encouraging
- Never condescending or harsh
- Casual language, can be playful
- Keep responses to 1-2 short sentences max

Respond with ONLY the message text, no JSON, no quotes, no extra formatting."""

CONTEXT_TEMPLATES = {
    CoachContext.RESULTS_RECEIVED: "The student just received grading results. {summary}",
    CoachContext.IDLE_NUDGE: "The student has been idle. {summary}",
    CoachContext.HISTORY_VISIT: "The student is browsing their essay history. {summary}",
    CoachContext.ON_DEMAND: "The student clicked on you for a tip. {summary}",
    CoachContext.GREETING: "The student just opened the app. {summary}",
}


async def _compute_history_summary(
    db: AsyncSession, user_id: UUID, submission_id: Optional[UUID] = None
) -> str:
    """Build a text summary of the user's grading history for the LLM prompt."""
    # Get total count and average score
    result = await db.execute(
        select(
            func.count(Submission.id),
            func.avg(Submission.overall_score),
            func.avg(Submission.max_score),
        ).where(Submission.user_id == user_id)
    )
    row = result.one()
    total = row[0] or 0
    avg_score = row[1]
    avg_max = row[2]

    if total == 0:
        return "This is a new user with no grading history yet."

    parts = [f"They have submitted {total} essay(s)."]

    if avg_score is not None and avg_max is not None and avg_max > 0:
        pct = (avg_score / avg_max) * 100
        parts.append(f"Average score: {pct:.0f}%.")

    # Get the specific submission if provided
    if submission_id:
        sub = await db.execute(
            select(Submission).where(
                Submission.id == submission_id, Submission.user_id == user_id
            )
        )
        submission = sub.scalar_one_or_none()
        if submission and submission.result:
            result_data = submission.result
            score = result_data.get("overall_score", 0)
            max_score = result_data.get("max_score", 100)
            pct = (score / max_score) * 100 if max_score > 0 else 0
            parts.append(f"Latest essay scored {pct:.0f}%.")

            # Find weakest and strongest categories
            categories = result_data.get("categories", [])
            if categories:
                sorted_cats = sorted(
                    categories,
                    key=lambda c: c.get("score", 0) / max(c.get("max_score", 1), 1),
                )
                weakest = sorted_cats[0].get("name", "unknown")
                strongest = sorted_cats[-1].get("name", "unknown")
                parts.append(f"Weakest: {weakest}. Strongest: {strongest}.")

    return " ".join(parts)


async def get_coaching_message(
    db: AsyncSession,
    user_id: UUID,
    context: CoachContext,
    submission_id: Optional[UUID] = None,
) -> str:
    """Generate a coaching message using the LLM."""
    try:
        summary = await _compute_history_summary(db, user_id, submission_id)
        user_prompt = CONTEXT_TEMPLATES[context].format(summary=summary)

        settings = get_settings()
        client = get_llm_client(settings)
        response = await client.complete(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_prompt,
            json_schema=None,
        )

        # The response should be plain text, strip any quotes
        message = response.strip().strip('"').strip("'")
        if len(message) > 200:
            message = message[:200] + "..."

        return message

    except Exception:
        logger.exception("Coach LLM call failed, using fallback")
        return FALLBACK_MESSAGES.get(
            context, "Keep writing — every essay makes you better!"
        )
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/services/coach.py
git commit -m "feat(mascot): add coach service with LLM-powered tips and history summary"
```

---

### Task 20: Create coach route

**Files:**
- Create: `backend/app/routes/coach.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Create the route**

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.deps import get_db
from app.models.user import User
from app.schemas.coach import CoachRequest, CoachResponse
from app.services.coach import get_coaching_message

router = APIRouter(prefix="/coach", tags=["coach"])


@router.post("", response_model=CoachResponse)
async def coach(
    body: CoachRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    message = await get_coaching_message(
        db=db,
        user_id=user.id,
        context=body.context,
        submission_id=body.submission_id,
    )
    return CoachResponse(message=message)
```

- [ ] **Step 2: Register the route in main.py**

In `backend/app/main.py`, follow the existing `api_router` pattern. Update the import line and add the router:

```python
# Update the import line:
from .routes import auth, coach, grading, health, history

# Add alongside existing router registrations:
api_router.include_router(coach.router)
```

This keeps the pattern consistent with how `auth`, `grading`, `health`, and `history` routers are registered via `api_router`.

- [ ] **Step 3: Commit**

```bash
git add backend/app/routes/coach.py backend/app/main.py
git commit -m "feat(mascot): add POST /api/coach endpoint with auth"
```

---

### Task 21: Update LLM client to support plain text (no JSON schema)

**Files:**
- Check: `backend/app/llm/anthropic.py`
- Check: `backend/app/llm/client.py`

The coach service passes `json_schema=None` to `client.complete()`. The existing Anthropic client uses tool-use mode which requires a schema. We need to update the Protocol and all client implementations.

- [ ] **Step 1: Update the LLMClient Protocol**

In `backend/app/llm/client.py`, change the Protocol signature to accept `None`:

```python
class LLMClient(Protocol):
    async def complete(
        self, system_prompt: str, user_prompt: str, json_schema: dict | None
    ) -> str: ...
```

- [ ] **Step 2: Update the Anthropic client**

In `backend/app/llm/anthropic.py`, update the `complete` method signature to `json_schema: dict | None` and add a plain-text branch at the top:

```python
if json_schema is None:
    response = await self.client.messages.create(
        model=self.model,
        max_tokens=60,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )
    return response.content[0].text
```

Note: `max_tokens=60` aligns with the spec's ~50 token target (with a small buffer).

- [ ] **Step 3: Update other LLM clients**

Update `backend/app/llm/openai.py` and `backend/app/llm/ollama.py` — change their `complete` signatures to `json_schema: dict | None` and add the `json_schema is None` branch to each, making a standard text completion call.

- [ ] **Step 3: Commit**

```bash
git add backend/app/llm/
git commit -m "feat(mascot): support plain text LLM calls (no JSON schema) for coaching"
```

---

## Chunk 6: Phase B — Frontend Coaching Integration

### Task 22: Create frontend coach API function

**Files:**
- Create: `src/api/coach.ts`

- [ ] **Step 1: Add the API function**

```typescript
import { apiClient } from "./client";

export type CoachContext =
  | "results_received"
  | "idle_nudge"
  | "history_visit"
  | "on_demand"
  | "greeting";

interface CoachResponse {
  message: string;
  foxState: string;
}

export async function getCoachingTip(
  context: CoachContext,
  submissionId?: string
): Promise<CoachResponse> {
  const { data } = await apiClient.post<CoachResponse>("/coach", {
    context,
    submissionId,
  });
  return data;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/api/coach.ts
git commit -m "feat(mascot): add frontend coach API client"
```

---

### Task 23: Create useFoxCoach hook

**Files:**
- Create: `src/components/mascot/use-fox-coach.ts`

- [ ] **Step 1: Create the hook**

This hook handles debouncing, caching, and error fallbacks:

```typescript
import { useRef, useCallback } from "react";
import { getCoachingTip, type CoachContext } from "@/api/coach";
import { useFoxStore } from "@/stores/fox-store";
import { useProfileStore } from "@/stores/profile-store";

const DEBOUNCE_MS = 30_000;

export function useFoxCoach() {
  const showCoachingTip = useFoxStore((s) => s.showCoachingTip);
  const isSignedIn = useProfileStore((s) => s.isSignedIn);
  const lastCallRef = useRef(0);
  const cacheRef = useRef<Map<string, string>>(new Map());

  const requestTip = useCallback(
    async (context: CoachContext, submissionId?: string) => {
      if (!isSignedIn) return;

      // Debounce
      const now = Date.now();
      if (now - lastCallRef.current < DEBOUNCE_MS) return;

      // Check cache
      const cacheKey = `${context}:${submissionId ?? "none"}`;
      const cached = cacheRef.current.get(cacheKey);
      if (cached) {
        showCoachingTip(cached);
        return;
      }

      lastCallRef.current = now;

      try {
        const response = await getCoachingTip(context, submissionId);
        cacheRef.current.set(cacheKey, response.message);
        showCoachingTip(response.message);
      } catch {
        // Silently fail — fox just doesn't show a tip
      }
    },
    [isSignedIn, showCoachingTip]
  );

  return { requestTip };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/mascot/use-fox-coach.ts
git commit -m "feat(mascot): add useFoxCoach hook with debounce and caching"
```

---

### Task 24: Wire up coaching to GradingPage results

**Files:**
- Modify: `src/pages/GradingPage.tsx`

- [ ] **Step 1: Import and use the coaching hook**

```tsx
import { useFoxCoach } from "@/components/mascot/use-fox-coach";

// Inside the component:
const { requestTip } = useFoxCoach();
```

- [ ] **Step 2: Request coaching tip after grading results**

After the result is received and the fox state is set (from Task 15), add:

```tsx
// After setCurrentResult(result):
requestTip("results_received", result.id);
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/GradingPage.tsx
git commit -m "feat(mascot): request coaching tip after grading results"
```

---

### Task 25: Wire up coaching to EssaysPage

**Files:**
- Modify: `src/pages/EssaysPage.tsx`

- [ ] **Step 1: Request history visit tip on mount**

```tsx
import { useFoxCoach } from "@/components/mascot/use-fox-coach";

// Inside the component:
const { requestTip } = useFoxCoach();

useEffect(() => {
  setFoxState("browsing");
  requestTip("history_visit");
  return () => setFoxState("idle");
}, [setFoxState, requestTip]);
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/EssaysPage.tsx
git commit -m "feat(mascot): request coaching tip on history page visit"
```

---

### Task 26: Wire up on-demand coaching to FoxCompanion click

**Files:**
- Modify: `src/components/mascot/FoxCompanion.tsx`

- [ ] **Step 1: Replace placeholder click handler with real coaching**

```tsx
import { useFoxCoach } from "./use-fox-coach";

// Inside the component:
const { requestTip } = useFoxCoach();

const handleClick = () => {
  if (isBubbleVisible) {
    dismissBubble();
  } else {
    requestTip("on_demand");
  }
};
```

Remove the old placeholder `showCoachingTip("Click me after grading...")` call.

- [ ] **Step 2: Commit**

```bash
git add src/components/mascot/FoxCompanion.tsx
git commit -m "feat(mascot): wire up on-demand coaching to fox click"
```

---

### Task 27: Add first-visit-of-day greeting

**Files:**
- Modify: `src/components/mascot/FoxCompanion.tsx`

- [ ] **Step 1: Add localStorage check and greeting on mount**

```tsx
const LAST_VISIT_KEY = "redpen-last-visit";

// Inside the component, add an effect:
useEffect(() => {
  const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
  const today = new Date().toDateString();

  if (lastVisit !== today) {
    localStorage.setItem(LAST_VISIT_KEY, today);
    // Delay greeting slightly so the page settles
    const timer = setTimeout(() => {
      requestTip("greeting");
    }, 1500);
    return () => clearTimeout(timer);
  }
}, [requestTip]);
```

- [ ] **Step 2: Commit**

```bash
git add src/components/mascot/FoxCompanion.tsx
git commit -m "feat(mascot): add first-visit-of-day greeting"
```

---

### Task 28: Final integration test

- [ ] **Step 1: Start the full stack**

```bash
docker compose up -d --build
```

- [ ] **Step 2: Manual verification checklist**

Test each fox behavior:
1. Landing page — fox is waving
2. Sign in → grading page — fox is idle
3. Start typing — fox becomes attentive
4. Stop typing for 30s — fox returns to idle
5. Submit essay — fox shows thinking state
6. Results arrive — fox celebrates (>80%) or encourages (<60%)
7. Speech bubble appears with coaching tip after results
8. Click the fox — on-demand tip appears
9. Navigate to history — fox browses
10. Dismiss speech bubble with X or Escape
11. Wait 2 minutes idle — fox falls asleep
12. Toggle dark mode — fox and bubble look correct in both themes
13. Check `prefers-reduced-motion` — fox shows static poses

- [ ] **Step 3: Final commit if any adjustments needed**

```bash
git add -A
git commit -m "fix(mascot): final integration adjustments"
```
