---
phase: 23-writing-timer-file-upload
plan: 01
subsystem: ui
tags: [zustand, timer, react-hooks, lucide-react, sonner]

# Dependency graph
requires:
  - phase: 19-tiptap-editor-foundation
    provides: GradingPage bottom panel layout and WordStats component pattern

provides:
  - Timer state fields (timerEndTime, timerPaused, timerRemainingMs) in Zustand persist store
  - startTimer, cancelTimer, pauseTimer, resumeTimer, updateTimerDuration actions
  - useTimer hook with setInterval lifecycle, expiry detection, pause/resume
  - formatRemainingTime helper (mm:ss / h:mm:ss)
  - TimerDisplay component for bottom panel countdown

affects: [23-02-writing-timer-popover-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useAppStore.getState() inside setInterval callback to avoid stale closure
    - firedRef guard pattern to fire toast exactly once on expiry
    - Absolute timestamp (timerEndTime epoch ms) instead of decrementing counter

key-files:
  created:
    - src/hooks/useTimer.ts
    - src/components/grading/TimerDisplay.tsx
  modified:
    - src/stores/app-store.ts

key-decisions:
  - "Store absolute epoch ms (timerEndTime) rather than decrementing a counter — survives page reloads accurately"
  - "useAppStore.getState() inside interval callback avoids stale closure on timerEndTime"
  - "Expired timer cleared silently on mount (no toast) when tab was closed during countdown"
  - "TimerDisplay omits rounded-b-lg and border-t — parent container handles layout when sharing row with WordStats"

patterns-established:
  - "getState() pattern: always use useAppStore.getState().action() inside async/interval callbacks"
  - "firedRef pattern: useRef boolean guard to prevent duplicate toast on fast re-renders"

requirements-completed: [TOOL-02]

# Metrics
duration: 2min
completed: 2026-03-13
---

# Phase 23 Plan 01: Writing Timer — Data Layer Summary

**Zustand persist store (v4) with absolute-timestamp timer state, useTimer lifecycle hook with expiry detection, and TimerDisplay countdown component**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-14T02:19:41Z
- **Completed:** 2026-03-14T02:21:47Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Timer state (timerEndTime, timerPaused, timerRemainingMs) added to Zustand persist store with version 4 migration
- Five timer actions (startTimer, cancelTimer, pauseTimer, resumeTimer, updateTimerDuration) implemented cleanly with get() for pause snapshot
- useTimer hook manages setInterval lifecycle, fires "Time's up!" toast exactly once via firedRef, and silently clears expired timers on mount
- TimerDisplay renders mm:ss or h:mm:ss countdown with Timer icon, switching to text-destructive below 60 seconds

## Task Commits

Each task was committed atomically:

1. **Task 1: Add timer state and actions to Zustand store** - `1464749` (feat)
2. **Task 2: Create useTimer hook and TimerDisplay component** - `f8d78b5` (feat)

## Files Created/Modified

- `src/stores/app-store.ts` - Added 3 timer fields, 5 actions, bumped persist version 3→4 with cascading migration
- `src/hooks/useTimer.ts` - Timer lifecycle hook: interval, expiry detection, pause/resume, formatRemainingTime helper
- `src/components/grading/TimerDisplay.tsx` - Bottom panel countdown display with Timer icon and urgency color

## Decisions Made

- Used absolute epoch ms (timerEndTime) instead of a decrementing counter — surviving page reloads with correct remaining time
- Called `useAppStore.getState()` inside the setInterval callback to read fresh timerEndTime without stale closure
- On mount, expired timers are cleared without toast — the user already left the tab, firing a toast retroactively would be confusing
- TimerDisplay does not include `rounded-b-lg` or `border-t` — Plan 02 will integrate it alongside WordStats and the parent handles those layout classes

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Timer data layer is complete. Plan 02 (23-02) can now build the popover UI, wire TimerDisplay into the GradingPage bottom panel alongside WordStats, and integrate start/pause/cancel controls into the toolbar.
- No blockers.

---
*Phase: 23-writing-timer-file-upload*
*Completed: 2026-03-13*
