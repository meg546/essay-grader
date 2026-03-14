# Phase 23: Writing Timer & File Upload - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning
**Source:** PRD Express Path (docs/superpowers/specs/2026-03-13-writing-timer-design.md)

<domain>
## Phase Boundary

This phase delivers a Writing Timer feature for the GradingToolbar. File Upload is already implemented (EssayUploadModal exists) — only the timer portion remains.

The timer replaces the History button (Clock icon) in the toolbar sidebar with a Timer icon that opens a popover for setting countdown durations. A live countdown displays in the bottom panel of the essay input area.

</domain>

<decisions>
## Implementation Decisions

### Toolbar Activation
- Replace Clock/History link with Timer lucide icon opening a Popover
- Popover shows 4 preset buttons (15m, 30m, 45m, 1h) + iOS-style scroll wheel picker (1–120 min)
- Presets scroll the picker to that value but do NOT auto-start — user clicks Start
- Start button begins countdown and closes popover
- When timer running: popover shows live scroll picker counting down, Set button, Cancel button
- Active indicator dot (green) on toolbar icon when timer running

### Bottom Panel Display
- Countdown appears in bottom panel alongside WordStats (both visible simultaneously)
- WordStats on left, timer on right
- Format: mm:ss or h:mm:ss for durations over 60 minutes
- TimerDisplay renders independently from WordStats with its own container
- Styled to match WordStats aesthetics

### Timer Expiry
- Toast notification "Time's up!" when timer reaches zero
- Timer disappears from bottom panel
- Toolbar icon loses active indicator dot
- Timer state cleared from store

### Timer & Grading Submission
- Timer cancelled automatically on "Submit for Grading"
- Starting new essay ("Grade Another") starts fresh with no timer

### Timer & Clear
- Clicking "Clear" does NOT cancel the timer — student may want timer running for fresh attempt

### State & Persistence
- Timer state in `useAppStore` with persist (Zustand store approach B)
- Fields: `timerEndTime: number | null`, `timerPaused: boolean`, `timerRemainingMs: number | null`
- Actions: `startTimer`, `cancelTimer`, `pauseTimer`, `resumeTimer`, `updateTimerDuration`
- Store version bump 3 → 4 with cascading migration
- Add timer fields to `partialize` return object

### Auto-Pause / Auto-Resume
- On route navigation away from /grade: pause (snapshot remainingMs)
- On return to /grade: resume (recompute endTime from remainingMs)
- On page reload while on /grade: resume if paused, check expiry if not paused
- document.visibilitychange NOT used — only route navigation

### Display Accuracy
- Compute remaining time as `timerEndTime - Date.now()` on each setInterval tick (~1s)
- Never decrement a counter — always derive from absolute timestamp

### Scroll Wheel Picker
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

</decisions>

<specifics>
## Specific Ideas

- Use lucide `Timer` icon (not Clock)
- Green active indicator dot matching rubric upload pattern
- Custom `useTimer` hook to encapsulate setInterval, expiry detection, pause/resume lifecycle
- ScrollPicker component as reusable iOS-style wheel

</specifics>

<deferred>
## Deferred Ideas

- File Upload — already implemented via EssayUploadModal (EDIT-02 already satisfied)
- Pomodoro-style break cycles
- Timer history or analytics
- Sound/audio alerts

</deferred>

---

*Phase: 23-writing-timer-file-upload*
*Context gathered: 2026-03-13 via PRD Express Path*
