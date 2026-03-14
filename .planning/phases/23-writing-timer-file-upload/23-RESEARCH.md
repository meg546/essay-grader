# Phase 23: Writing Timer & File Upload - Research

**Researched:** 2026-03-13
**Domain:** React timer state management, CSS scroll-snap picker, Zustand persist migration
**Confidence:** HIGH

## Summary

Phase 23 delivers a writing timer feature onto the existing GradingToolbar. File Upload is already fully implemented via `EssayUploadModal` and direct drag-and-drop in `EssayInput` — EDIT-02 requires only verification. The timer is the entire implementation scope.

The design is well-specified: replace the Clock/History toolbar link with a Timer icon opening a Base UI Popover, a custom `ScrollPicker` component using CSS scroll-snap, a `useTimer` hook backed by absolute timestamps in Zustand persist (version 3 → 4 migration), and a `TimerDisplay` component in the bottom panel alongside `WordStats`. Route-navigation-based auto-pause uses React Router v7's `useLocation` hook.

The project uses React 19, Zustand 5, React Router 7, Lucide React 0.577, Base UI Popovers, sonner toasts, and Tailwind CSS 4. No new dependencies are required for this phase.

**Primary recommendation:** Build three new files (`useTimer.ts` hook, `ScrollPicker.tsx` component, `TimerDisplay.tsx` component) plus a `TimerPopover.tsx` that orchestrates them, then wire into the existing `GradingToolbar` and `GradingPage`.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Replace Clock/History link with Timer lucide icon opening a Popover
- Popover shows 4 preset buttons (15m, 30m, 45m, 1h) + iOS-style scroll wheel picker (1–120 min)
- Presets scroll the picker to that value but do NOT auto-start — user clicks Start
- Start button begins countdown and closes popover
- When timer running: popover shows live scroll picker counting down, Set button, Cancel button
- Active indicator dot (green) on toolbar icon when timer running
- Countdown appears in bottom panel alongside WordStats (both visible simultaneously)
- WordStats on left, timer on right
- Format: mm:ss or h:mm:ss for durations over 60 minutes
- TimerDisplay renders independently from WordStats with its own container
- Styled to match WordStats aesthetics
- Toast notification "Time's up!" when timer reaches zero
- Timer disappears from bottom panel on expiry
- Toolbar icon loses active indicator dot on expiry
- Timer state cleared from store on expiry
- Timer cancelled automatically on "Submit for Grading"
- Starting new essay ("Grade Another") starts fresh with no timer
- Clicking "Clear" does NOT cancel the timer
- Timer state in `useAppStore` with persist (Zustand store approach B)
- Fields: `timerEndTime: number | null`, `timerPaused: boolean`, `timerRemainingMs: number | null`
- Actions: `startTimer`, `cancelTimer`, `pauseTimer`, `resumeTimer`, `updateTimerDuration`
- Store version bump 3 → 4 with cascading migration
- Add timer fields to `partialize` return object
- On route navigation away from /grade: pause (snapshot remainingMs)
- On return to /grade: resume (recompute endTime from remainingMs)
- On page reload while on /grade: resume if paused, check expiry if not paused
- document.visibilitychange NOT used — only route navigation
- Compute remaining time as `timerEndTime - Date.now()` on each setInterval tick (~1s)
- Never decrement a counter — always derive from absolute timestamp
- CSS scroll-snap-type: y mandatory with scroll-snap-align: center
- Center row highlighted, items above/below faded/scaled
- Touch, mouse wheel, click-to-select supported
- IntersectionObserver or scroll event for value detection
- Live countdown mode: auto-scrolls every minute when timer running
- User manual scroll pauses auto-scroll until Set or close

### Claude's Discretion
- Exact animation/transition details for scroll picker
- Specific CSS values for fading/scaling non-center items
- Internal implementation of useTimer hook
- Exact toast styling and duration

### Deferred Ideas (OUT OF SCOPE)
- File Upload — already implemented via EssayUploadModal (EDIT-02 already satisfied)
- Pomodoro-style break cycles
- Timer history or analytics
- Sound/audio alerts
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TOOL-02 | User can set a writing timer with preset durations from the toolbar | Timer Popover + ScrollPicker + useTimer hook + TimerDisplay in bottom panel |
| EDIT-02 | User can drag-and-drop or upload .txt/.pdf files into the editor | Already implemented in EssayInput (drag-drop) and EssayUploadModal (toolbar button) — verification only |
</phase_requirements>

---

## Standard Stack

### Core (all already installed — no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | 5.0.11 | Timer state + persist | Already used for all app state |
| lucide-react | 0.577.0 | Timer icon (confirmed present) | Already used throughout toolbar |
| @base-ui/react | ^1.2.0 | Popover primitive | Already used for all toolbar popovers |
| sonner | ^2.0.7 | "Time's up!" toast | Already used for all toasts |
| react-router | ^7.13.1 | useLocation for route-change pause/resume | Already used throughout app |
| tailwindcss | ^4.2.1 | Scroll picker styling | Already used for all styles |

**No new packages needed.**

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS scroll-snap custom picker | react-scroll-picker, react-ios-picker | Adds a dependency; CSS scroll-snap is sufficient for 1-120 range and matches project pattern of minimal deps |
| setInterval tick | requestAnimationFrame | setInterval (~1s) is simpler, sufficient accuracy for minute-granularity timer |

## Architecture Patterns

### Recommended File Structure

```
src/
├── hooks/
│   └── useTimer.ts           # NEW — timer lifecycle: start/pause/resume/cancel/expiry
├── components/grading/
│   ├── ScrollPicker.tsx       # NEW — reusable iOS-style scroll wheel (1–120)
│   ├── TimerPopover.tsx       # NEW — toolbar popover orchestrating ScrollPicker + presets
│   ├── TimerDisplay.tsx       # NEW — bottom panel countdown display
│   ├── GradingToolbar.tsx     # MODIFY — replace Clock link with TimerPopover
│   └── WordStats.tsx          # MODIFY — sibling layout with TimerDisplay
├── stores/
│   └── app-store.ts           # MODIFY — add timer fields, version 3→4 migration
└── pages/
    └── GradingPage.tsx        # MODIFY — cancel timer on submit, pass timer cancel to handleReset
```

### Pattern 1: Absolute-Timestamp Timer in Zustand

**What:** Store `timerEndTime` (epoch ms) rather than remaining seconds. On each tick, derive remaining from `Date.now()`.

**When to use:** Any countdown that must survive re-renders, tab switches, or page reload. Eliminates timer drift from stale closures.

**Example:**
```typescript
// src/hooks/useTimer.ts
import { useEffect, useRef } from "react";
import { useAppStore } from "@/stores/app-store";

export function useTimer() {
  const { timerEndTime, timerPaused, timerRemainingMs, cancelTimer } = useAppStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!timerEndTime || timerPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      const remaining = timerEndTime - Date.now();
      if (remaining <= 0) {
        cancelTimer();
        // toast fired inside cancelTimer or here
      }
    }, 1_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerEndTime, timerPaused, cancelTimer]);

  const remainingMs = timerPaused
    ? (timerRemainingMs ?? 0)
    : timerEndTime
      ? Math.max(0, timerEndTime - Date.now())
      : null;

  return { remainingMs };
}
```

### Pattern 2: Zustand v5 Persist Version Migration

**What:** Bump `version` and add migration case. Partialize must include new fields for persistence.

**Current store version:** 3 (see `app-store.ts` line 40)

**Example:**
```typescript
// app-store.ts additions
interface AppState {
  // ... existing fields ...
  timerEndTime: number | null;
  timerPaused: boolean;
  timerRemainingMs: number | null;
  startTimer: (durationMs: number) => void;
  cancelTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  updateTimerDuration: (durationMs: number) => void;
}

// Inside persist config:
{
  name: "essay-grader-app",
  version: 4,
  migrate: (persisted, version) => {
    const state = persisted as Record<string, unknown>;
    if (version < 2) {
      return { ...state, history: undefined };
    }
    if (version < 3) {
      state.textSize = "normal";
    }
    if (version < 4) {
      state.timerEndTime = null;
      state.timerPaused = false;
      state.timerRemainingMs = null;
    }
    return state;
  },
  partialize: (state) => ({
    essayText: state.essayText,
    textSize: state.textSize,
    timerEndTime: state.timerEndTime,
    timerPaused: state.timerPaused,
    timerRemainingMs: state.timerRemainingMs,
  }),
}
```

### Pattern 3: CSS Scroll-Snap Picker

**What:** A scrollable container with `scroll-snap-type: y mandatory` and items with `scroll-snap-align: center`. The highlighted center row is detected via `scrollTop` math or IntersectionObserver.

**When to use:** Discrete numeric selection (1–120 minutes) without a dependency.

**Example:**
```typescript
// src/components/grading/ScrollPicker.tsx
import { useRef, useEffect, useCallback } from "react";

interface ScrollPickerProps {
  value: number;         // currently selected minute value
  onChange: (val: number) => void;
  min?: number;          // default 1
  max?: number;          // default 120
  disabled?: boolean;    // true when timer is running (controlled countdown mode)
}

const ITEM_HEIGHT = 36; // px — matches h-9 in Tailwind

export function ScrollPicker({ value, onChange, min = 1, max = 120, disabled = false }: ScrollPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const userScrollingRef = useRef(false);

  // Programmatic scroll to value
  const scrollToValue = useCallback((v: number) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: (v - min) * ITEM_HEIGHT, behavior: "smooth" });
  }, [min]);

  // Sync scroll when value prop changes (preset buttons, countdown)
  useEffect(() => {
    if (!userScrollingRef.current) scrollToValue(value);
  }, [value, scrollToValue]);

  function handleScroll() {
    const el = containerRef.current;
    if (!el || disabled) return;
    userScrollingRef.current = true;
    const index = Math.round(el.scrollTop / ITEM_HEIGHT);
    onChange(Math.min(max, Math.max(min, index + min)));
    // Reset after scroll settles
    clearTimeout((handleScroll as any)._t);
    (handleScroll as any)._t = setTimeout(() => { userScrollingRef.current = false; }, 150);
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="relative h-[108px] overflow-y-scroll scroll-smooth snap-y snap-mandatory overscroll-none"
      style={{ scrollSnapType: "y mandatory" }}
    >
      {/* padding spacers so first/last items can center */}
      <div style={{ height: ITEM_HEIGHT }} />
      {Array.from({ length: max - min + 1 }, (_, i) => i + min).map((v) => (
        <div
          key={v}
          onClick={() => { if (!disabled) { onChange(v); scrollToValue(v); } }}
          style={{ scrollSnapAlign: "center", height: ITEM_HEIGHT }}
          className={cn(
            "flex items-center justify-center text-sm transition-all cursor-pointer select-none",
            v === value
              ? "font-semibold text-foreground scale-110"
              : "text-muted-foreground/50 scale-90"
          )}
        >
          {v}
        </div>
      ))}
      <div style={{ height: ITEM_HEIGHT }} />
    </div>
  );
}
```

### Pattern 4: Route-Navigation Pause/Resume

**What:** `useLocation` in a `useEffect` dependency to detect when user leaves/returns to `/grade`.

**When to use:** Pause timer on navigation away, resume on return. React Router v7 `useLocation` is the established pattern in this project (already used in `Header.tsx`).

**Example:**
```typescript
// Inside GradingPage or useTimer hook — detect route changes
import { useLocation } from "react-router";
import { useEffect, useRef } from "react";
import { useAppStore } from "@/stores/app-store";

function useTimerRouteSync() {
  const location = useLocation();
  const { timerEndTime, timerPaused, pauseTimer, resumeTimer } = useAppStore();
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    const wasOnGrade = prevPathRef.current === "/grade";
    const isOnGrade = location.pathname === "/grade";

    if (wasOnGrade && !isOnGrade && timerEndTime && !timerPaused) {
      pauseTimer(); // snapshot remainingMs
    } else if (!wasOnGrade && isOnGrade && timerPaused) {
      resumeTimer(); // recompute endTime from remainingMs
    }

    prevPathRef.current = location.pathname;
  }, [location.pathname, timerEndTime, timerPaused, pauseTimer, resumeTimer]);
}
```

### Pattern 5: Toolbar Popover with Active Indicator Dot

**What:** Same structure as existing `ToneSelector` and `TextSizeSelector` — `Popover` + `Tooltip` + `PopoverTrigger` wrapping `TooltipTrigger`. Active dot matches rubric upload dot pattern.

**Active indicator dot (existing rubric pattern — `GradingToolbar.tsx` line 111):**
```typescript
{timerRunning && (
  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green-500" />
)}
```

### Pattern 6: Bottom Panel Layout (WordStats + TimerDisplay side-by-side)

**What:** Wrap `WordStats` and `TimerDisplay` in a flex row in `GradingPage`. Both components render independently.

**Current `GradingPage.tsx` line 156:**
```tsx
<WordStats essayText={essayText} visible={showStats} />
```

**Updated pattern:**
```tsx
<div className="flex items-center justify-between">
  <WordStats essayText={essayText} visible={showStats} />
  <TimerDisplay />
</div>
```

`TimerDisplay` reads from `useAppStore` directly (no props) and returns `null` when no timer is active.

### Pattern 7: Time Formatting

```typescript
export function formatRemainingTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1_000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
```

### Anti-Patterns to Avoid

- **Decrementing a counter in state:** Causes drift over re-renders and stale closures. Always derive from `timerEndTime - Date.now()`.
- **Storing remaining seconds as the primary field:** Makes pause/resume math awkward and loses sub-second accuracy. Use `timerEndTime` (epoch ms) as source of truth.
- **Firing toast inside setInterval directly:** The interval callback fires every second — guard with a "fired" ref or fire inside `cancelTimer` action to ensure toast fires exactly once.
- **Using document.visibilitychange:** Decided against by user — use route navigation only.
- **Cancelling timer on Clear:** Explicitly out of scope per user decision.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Popover positioning | Custom absolute positioning | `@base-ui/react Popover` | Already used in this toolbar for Clear, TextSize, Tone |
| Toast notification | Custom toast overlay | `sonner toast()` | Already wired in `App.tsx` and used throughout |
| Icon | SVG timer icon from scratch | `lucide-react Timer` | Confirmed present in installed 0.577.0 |
| File upload | New upload logic | Existing `EssayUploadModal` + drag-drop in `EssayInput` | EDIT-02 is already satisfied |

## Common Pitfalls

### Pitfall 1: setInterval Stale Closure on Store Actions

**What goes wrong:** `cancelTimer` referenced in `useEffect` callback captures stale version if store reference changes between renders.

**Why it happens:** Zustand selectors return stable references for primitives, but action functions can be re-created if the store is reconstructed (rare but possible on HMR).

**How to avoid:** Call `useAppStore.getState().cancelTimer()` inside the interval callback instead of closing over the selector result. This is the same pattern already used in `EssayInput.tsx` line 97 for `setEssayText`.

**Warning signs:** Toast fires multiple times or timer doesn't stop at zero.

### Pitfall 2: ScrollPicker Scrolls Fighting Each Other

**What goes wrong:** `useEffect` that scrolls to `value` prop fires at the same time user is manually scrolling, causing jerky behavior.

**Why it happens:** Prop updates from countdown trigger `scrollTo` while the scroll event handler is still settling.

**How to avoid:** `userScrollingRef` flag — set true on `onScroll`, clear after debounce. Only call `scrollToValue` when `!userScrollingRef.current`.

### Pitfall 3: Timer Resumes After Expiry on Page Reload

**What goes wrong:** User had a timer running, closes tab, reopens 10 minutes later. Timer expired while tab was closed, but persisted state has `timerEndTime` in the past.

**Why it happens:** Persist stores `timerEndTime` but doesn't check expiry at rehydration time.

**How to avoid:** On mount (inside `useTimer` hook), check if `timerEndTime < Date.now()` and call `cancelTimer()` immediately without firing the toast.

**Warning signs:** Stale "0:00" display on load, or negative remaining time.

### Pitfall 4: Popover Stays Open After Timer Starts

**What goes wrong:** Popover remains visible after clicking Start, obscuring the view.

**Why it happens:** Popover open state is not closed when `startTimer` is called.

**How to avoid:** Call `setOpen(false)` in the Start button click handler immediately after `startTimer(...)`.

### Pitfall 5: Zustand Migration Missing Cascading Case

**What goes wrong:** Users on store version 1 or 2 skip the new timer fields migration entirely.

**Why it happens:** The existing migration pattern uses `if (version < 2)` with an early return.

**How to avoid:** The existing migration does NOT early-return — it uses sequential `if (version < N)` blocks that cascade. Add `if (version < 4)` block at the end. This matches the existing pattern in `app-store.ts` (lines 42-48).

### Pitfall 6: WordStats / TimerDisplay Layout Break When Both Visible

**What goes wrong:** If both `WordStats` and `TimerDisplay` appear at the same time with `flex justify-between`, the bottom panel grows taller on narrow screens.

**Why it happens:** Both components have `h-8` / min-height constraints that may conflict.

**How to avoid:** `TimerDisplay` should use the exact same Tailwind classes as `WordStats` (`flex items-center h-8 bg-muted/50 rounded-b-lg px-4 text-xs text-muted-foreground`). The wrapping container in `GradingPage` only renders the bottom bar div when at least one is visible.

## Code Examples

### GradingPage bottom panel wiring

```tsx
// GradingPage.tsx — replace WordStats line with:
{(showStats || timerActive) && (
  <div className="flex items-stretch">
    <WordStats essayText={essayText} visible={showStats} />
    <TimerDisplay />
  </div>
)}
```

Where `timerActive` = `useAppStore((s) => s.timerEndTime !== null || s.timerPaused)`.

### Timer store actions (startTimer / cancelTimer)

```typescript
startTimer: (durationMs: number) =>
  set({
    timerEndTime: Date.now() + durationMs,
    timerPaused: false,
    timerRemainingMs: null,
  }),

cancelTimer: () =>
  set({
    timerEndTime: null,
    timerPaused: false,
    timerRemainingMs: null,
  }),

pauseTimer: () =>
  set((state) => ({
    timerRemainingMs: state.timerEndTime
      ? Math.max(0, state.timerEndTime - Date.now())
      : state.timerRemainingMs,
    timerEndTime: null,
    timerPaused: true,
  })),

resumeTimer: () =>
  set((state) => ({
    timerEndTime: state.timerRemainingMs
      ? Date.now() + state.timerRemainingMs
      : null,
    timerPaused: false,
    timerRemainingMs: null,
  })),

updateTimerDuration: (durationMs: number) =>
  set({
    timerEndTime: Date.now() + durationMs,
    timerPaused: false,
    timerRemainingMs: null,
  }),
```

### Cancel timer on submit (GradingPage.tsx handleSubmit)

```typescript
async function handleSubmit() {
  useAppStore.getState().cancelTimer(); // add before gradeEssay call
  // ... existing submit logic
}
```

### Cancel timer on Grade Another (handleReset)

```typescript
function handleReset() {
  clearCurrentResult();
  setEssayText("");
  setRubricFile(null);
  useAppStore.getState().cancelTimer(); // add
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Zustand v4 persist API | Zustand v5 persist (same API, no breaking changes for persist middleware) | Zustand 5.0 | No migration needed — persist works identically |
| React Router v6 useLocation | React Router v7 useLocation (same API) | RR7 release | No change in hook usage |

## Open Questions

1. **Bottom panel layout when WordStats is hidden but timer is visible**
   - What we know: `WordStats` uses `visible` prop and returns `null` when hidden. `TimerDisplay` should always render if timer is active.
   - What's unclear: Does the wrapping flex row in GradingPage add visual height even when WordStats is null?
   - Recommendation: `TimerDisplay` provides its own full `h-8 bg-muted/50 rounded-b-lg` container independently; the wrapper only renders when at least one child is non-null.

2. **Scroll picker touch scrolling on iOS/Safari**
   - What we know: CSS `scroll-snap-type: y mandatory` works on iOS Safari. `-webkit-overflow-scrolling: touch` is legacy (no longer needed in modern iOS).
   - What's unclear: Whether momentum scrolling causes the picker to snap mid-item between fast swipes.
   - Recommendation: Add `overscroll-behavior: none` and `overscroll-contain` to the picker container to prevent scroll chaining.

## Validation Architecture

No test infrastructure exists in this project (no vitest.config, jest.config, or test files). This section identifies what would need to be created for automated validation.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None currently installed |
| Config file | None — Wave 0 gap |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TOOL-02 | Timer starts and displays countdown | manual/smoke | Manual browser verification | ❌ Wave 0 |
| TOOL-02 | Timer expires and fires toast + clears | manual/smoke | Manual browser verification | ❌ Wave 0 |
| TOOL-02 | Preset buttons scroll picker to correct value | manual/smoke | Manual browser verification | ❌ Wave 0 |
| TOOL-02 | Timer pauses on navigation, resumes on return | manual/smoke | Manual browser verification | ❌ Wave 0 |
| TOOL-02 | `formatRemainingTime` formats h:mm:ss correctly | unit | N/A — no framework | ❌ Wave 0 |
| EDIT-02 | Drag-and-drop .txt file loads into editor | manual/smoke | Manual browser verification | ❌ Wave 0 |
| EDIT-02 | Upload modal handles .pdf file | manual/smoke | Manual browser verification | ❌ Wave 0 |

### Wave 0 Gaps
No test framework is installed. For this phase, all validation is manual browser smoke testing. No Wave 0 test infrastructure tasks needed unless the team wants to introduce vitest (out of scope for this phase per project pattern).

*(All TOOL-02 and EDIT-02 validation is manual-only — justified because no test framework exists in the project and adding one is out of scope for this phase.)*

## Sources

### Primary (HIGH confidence)
- Codebase direct inspection — `src/stores/app-store.ts`, `GradingToolbar.tsx`, `WordStats.tsx`, `GradingPage.tsx`, `EssayInput.tsx`, `EssayUploadModal.tsx`, `ToneSelector.tsx`, `TextSizeSelector.tsx`
- Installed package versions verified directly: Zustand 5.0.11, lucide-react 0.577.0, @base-ui/react ^1.2.0, sonner ^2.0.7, react-router ^7.13.1
- `Timer` icon confirmed present in installed lucide-react via CJS require check

### Secondary (MEDIUM confidence)
- CSS scroll-snap-type MDN pattern — well-established CSS standard, no library needed
- Zustand v5 persist migration pattern — same API as v4, confirmed by reading installed node_modules package.json

### Tertiary (LOW confidence)
- iOS Safari scroll-snap momentum behavior — based on general CSS knowledge; recommend browser testing during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed, versions confirmed
- Architecture: HIGH — all patterns derived directly from existing codebase code
- Pitfalls: HIGH — most pitfalls are direct extensions of documented decisions in CONTEXT.md
- Scroll picker CSS behavior: MEDIUM — established CSS standard, iOS specifics need live testing

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable React/Zustand/Tailwind ecosystem — low churn risk)
