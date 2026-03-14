# Writing Timer — Design Spec

## Overview

Replace the History button (Clock icon) in the GradingToolbar sidebar with a Writing Timer. Students set a countdown duration via preset buttons or an iOS-style scroll wheel picker, and a live countdown appears in the bottom panel alongside WordStats.

## Target User

Students who want to practice timed essay writing.

## Goals

- Countdown timer activated from the toolbar sidebar
- Preset durations (15m, 30m, 45m, 1h) plus custom selection via scroll wheel picker
- Live countdown displayed in the bottom panel of the essay input area
- Timer auto-pauses when navigating away from the grading page, auto-resumes on return
- Timer state persisted in Zustand store (survives page reload)

## Non-Goals

- Pomodoro-style break cycles
- Timer history or analytics
- Sound/audio alerts (toast notification only)

---

## Section 1: Toolbar Activation

Replace the `Clock` icon + History link in `GradingToolbar` with a `Timer` lucide icon that opens a Popover.

### Popover — No Timer Running

- 4 preset buttons in a horizontal row: **15m**, **30m**, **45m**, **1h**
- Below: an iOS-style scroll wheel picker for custom minutes (1–120 range)
- A **Start** button at the bottom
- Selecting a preset pre-scrolls the picker to that value
- Clicking **Start** (or a preset directly) begins the countdown and closes the popover

### Popover — Timer Running

- The scroll wheel picker is **live** — it counts down in real-time showing current remaining minutes, so the user can see and adjust
- Preset buttons still available to quickly set a new duration
- A **Set** button to apply the new time from the picker
- A **Cancel** button to kill the timer

### Active Indicator

When a timer is running, the toolbar icon shows a small active indicator dot (green, matching the rubric upload pattern).

---

## Section 2: Bottom Panel Display

When a timer is active, a countdown display appears in the bottom panel below the essay editor, alongside the WordStats bar. Both can be visible simultaneously.

### Layout

- `WordStats` on the left side, timer countdown on the right side
- Timer display format: `23:41` (mm:ss), or `1:23:41` (h:mm:ss) for durations over 60 minutes
- Styled to match WordStats aesthetics (same text size, muted color, subtle)

### Timer Expiry

When the timer reaches zero:
1. Toast notification: "Time's up!"
2. Timer disappears from the bottom panel
3. Toolbar icon loses its active indicator dot
4. Timer state is cleared from the store

---

## Section 3: State & Persistence

### Store Changes (`useAppStore`)

Add timer fields to the persisted Zustand store:

```ts
// New fields
timerEndTime: number | null;      // Absolute timestamp (Date.now() + remaining ms)
timerPaused: boolean;             // True when navigated away from /grade
timerRemainingMs: number | null;  // Snapshot of remaining ms when paused
```

Actions:
```ts
startTimer: (durationMs: number) => void;   // Sets endTime, paused=false
cancelTimer: () => void;                     // Clears all timer state
pauseTimer: () => void;                      // Snapshots remaining, sets paused=true
resumeTimer: () => void;                     // Recomputes endTime from remaining, paused=false
updateTimerDuration: (durationMs: number) => void; // Updates endTime while running
```

### Store Migration

Bump store version from 3 to 4. Migration adds `timerEndTime: null`, `timerPaused: false`, `timerRemainingMs: null`.

### Partialize

Add `timerEndTime`, `timerPaused`, and `timerRemainingMs` to the `partialize` return object so they persist across reloads.

### Auto-Pause / Auto-Resume

- **On route navigation away from `/grade`:** Call `pauseTimer()` — snapshots `remainingMs = endTime - Date.now()`, sets `paused: true`
- **On return to `/grade`:** Call `resumeTimer()` — computes new `endTime = Date.now() + remainingMs`, sets `paused: false`
- **On page reload while on `/grade`:** If `timerPaused` is true in persisted state, call `resumeTimer()` on mount. If `timerPaused` is false, check if `timerEndTime` is still in the future — if so, resume; if expired, clear and show "Time's up!" toast.
- `document.visibilitychange` is NOT used — only route navigation triggers pause/resume

---

## Section 4: Scroll Wheel Picker Component

A custom `ScrollPicker` React component mimicking the iOS timer wheel.

### Implementation

- Vertical scroll container with minute values (1–120)
- CSS `scroll-snap-type: y mandatory` with `scroll-snap-align: center` on each item
- Center row visually highlighted (semi-transparent borders or background band)
- Items above and below center are slightly faded/scaled down
- Touch scrolling, mouse wheel, and click-to-select supported
- `IntersectionObserver` or `scroll` event to detect which value is centered and report it via `onChange` callback

### Live Countdown Mode

When a timer is running and the popover is open:
- The picker auto-scrolls to reflect the current remaining minutes
- Updates every minute (not every second — scrolling every second would be jarring)
- If the user manually scrolls, auto-scroll pauses until they click **Set** or close the popover

### Props

```ts
interface ScrollPickerProps {
  value: number;           // Current selected minute
  onChange: (min: number) => void;
  min?: number;            // Default 1
  max?: number;            // Default 120
}
```

---

## Section 5: File Structure

### New Files

- `src/components/grading/WritingTimer.tsx` — Timer popover with presets, scroll picker, and controls
- `src/components/grading/ScrollPicker.tsx` — Reusable iOS-style scroll wheel picker
- `src/components/grading/TimerDisplay.tsx` — Bottom panel countdown display

### Modified Files

- `src/components/grading/GradingToolbar.tsx` — Replace History link with WritingTimer
- `src/stores/app-store.ts` — Add timer state fields, actions, migration
- `src/pages/GradingPage.tsx` — Add TimerDisplay to bottom panel, handle auto-pause/resume on mount/unmount

---

## Accessibility

- Scroll picker is keyboard-navigable (arrow keys to change value)
- Timer countdown in bottom panel uses `aria-live="polite"` for screen reader updates (throttled to once per minute to avoid excessive announcements)
- Popover follows existing focus management patterns (focus trap, Escape to dismiss)
