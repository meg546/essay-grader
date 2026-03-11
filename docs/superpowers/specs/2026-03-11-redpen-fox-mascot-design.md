# Redpen — Fox Mascot & Rebrand Design Spec

**Date:** 2026-03-11
**Status:** Draft

## Overview

Rebrand the essay grading app from "EssayGrader" to **Redpen** and introduce a red fox mascot companion that lives throughout the app. The fox is reactive, always visible, and powered by LLM for contextual coaching tips. The visual style is smooth, rounded vector illustration — similar to Duolingo's owl (big expressive eyes, clean lines, simple shapes).

## Brand & Theme

### Name & Identity
- App name: **Redpen**
- Mascot: A red fox (unnamed for now — can be named later or let users name it)
- The red fox + red pen connection is the core brand identity

### Color Palette
- Subtle warm red accent — muted crimson or terracotta, not aggressive
- Used for: primary buttons, active states, accent highlights, logo
- Works in both light and dark mode
- Existing category colors (green for strengths, amber for improvements) stay unchanged
- The fox itself uses warm oranges/reds consistent with a red fox, not the UI accent red

### Assets to Update
- Logo (fox silhouette or fox holding a red pen)
- Page titles and meta tags (`<title>`, `<meta>` description, favicon)
- Landing page copy (hero headline, feature descriptions, CTA buttons)
- Header/nav branding
- README and any user-facing text referencing the old name

## Fox Mascot — Visual Design

### Style
- Smooth, rounded vector illustration (Duolingo Duo style)
- Big expressive eyes, simple shapes, clean outlines
- Minimal detail — reads well at small sizes (80x80px)
- Warm orange-red fur, cream/white chest, dark ear tips and paw accents
- Expressive through eye shape, ear position, tail movement, and body pose

### Size & Position
- Anchored **bottom-right corner** of every page
- Idle size: ~80x80px
- Expands slightly during animated reactions (~100x100px)
- Positioned `fixed` so it stays during scroll
- Sits above a subtle shadow or small platform so it doesn't float awkwardly
- Z-index above page content but below modals/dialogs

### Animation Technology
- **motion** library (already in the project) for state transitions and SVG animations during development
- Each fox state is a separate SVG component with motion-based transitions (crossfade/morph between states)
- **Lottie** (`lottie-react`) can be introduced later when designer-created animation assets are available — not needed for initial implementation
- Animations respect `prefers-reduced-motion` — falls back to static poses

### Fox States & Animations

| State | Visual | Trigger |
|-------|--------|---------|
| **Idle** | Gentle blink, slow tail swish | Default state, no activity |
| **Attentive** | Ears perked, eyes tracking | User starts typing essay |
| **Thinking** | Paw on chin, slight head tilt | Essay submitted, waiting for grading |
| **Celebrating** | Happy jump, sparkle particles | High score (>80%) |
| **Encouraging** | Soft eyes, gentle head tilt, small smile | Low score (<60%) or mixed results |
| **Coaching** | Holds up a tiny speech bubble, looks at user | LLM coaching tip ready |
| **Sleepy** | Yawns, curls up with tail over nose | Idle for 2+ minutes |
| **Browsing** | Flips through a tiny book | User on history page |
| **Waving** | Waves paw cheerfully | Landing page (unauthenticated visitors) |

## Fox Mascot — Reactive Behaviors

### Trigger Map

| Page/Event | Fox Behavior |
|------------|-------------|
| Any page, no activity | Idle animation |
| Landing page (unauthenticated) | Waving, inviting |
| User starts typing in essay input | Transitions to attentive |
| User stops typing for 30s | Back to idle |
| Essay submitted for grading | Thinking animation, stays until results |
| Grading results received, score > 80% | Celebrating for 3s, then coaching bubble |
| Grading results received, score 60-80% | Attentive, then coaching bubble |
| Grading results received, score < 60% | Encouraging for 3s, then coaching bubble |
| Idle for 2+ minutes on any page | Sleepy, then nudges with a tip |
| Navigate to history page | Browsing animation |
| Navigate to profile/settings | Relaxed idle |
| User clicks the fox | Opens coaching bubble (or dismisses if already open) |
| First visit of the day (localStorage timestamp check) | Waving + greeting coaching bubble |

### Speech Bubble
- Appears above the fox, pointing down to it
- Max width ~250px, rounded corners, subtle shadow
- Text is 1-2 short sentences, casual tone
- Dismiss button (small X) or click-away to close
- Auto-dismisses after 10 seconds if not interacted with (pauses auto-dismiss timer when bubble receives focus, for accessibility)
- Only one bubble at a time

## LLM-Powered Coaching

### Purpose
The fox gives short, personalized writing tips and encouragement based on the user's grading history and current context. It should feel like a friend who happens to be good at writing, not a teacher lecturing.

### Personality
- Friendly, slightly cheeky, always encouraging
- Never condescending or harsh
- Uses casual language, can be playful
- Keeps it short — one thought at a time
- Examples:
  - "Nice work on your evidence this time! Your thesis could use a sharper hook though."
  - "You've been on a roll — three essays this week!"
  - "Pro tip: try starting your conclusion with something other than 'In conclusion.'"
  - "Your organization scores keep climbing. Whatever you're doing, keep it up!"

### Backend Endpoint

**`POST /api/coach`** (requires authentication via `Depends(get_current_user)`)

The server looks up all relevant data from the database using the authenticated user's submissions. The client only sends the trigger context and an optional submission ID — no scores or history data.

Request:
```json
{
  "context": "results_received",
  "submission_id": "uuid-of-latest-submission"
}
```

Valid `context` values: `"results_received"`, `"idle_nudge"`, `"history_visit"`, `"on_demand"`, `"greeting"`

Response:
```json
{
  "message": "Your evidence game is strong! Let's work on making your thesis statements punchier next time.",
  "fox_state": "coaching"
}
```

The server computes history summary internally (total essays, avg score, weakest/strongest category, trend) from the user's submission records.

### Implementation Details
- Uses Claude API with a short system prompt defining the fox personality
- Response capped at ~50 tokens to keep cost and latency low
- Responses cached per trigger context per session (don't re-call for the same results page)
- Debounced — no more than one coaching call per 30 seconds
- Falls back to a predefined encouraging message if API call fails
- Model: `claude-haiku-4-5-20251001` (fast, cheap, good enough for short quips)

### Coaching Triggers
1. **After grading results** — summarize the key takeaway
2. **Idle nudge** — offer a writing tip based on weakest category from history
3. **History page visit** — comment on progress trend
4. **User clicks fox** — on-demand tip based on current context
5. **First visit of the day** — greeting + encouragement (detected via localStorage timestamp of last visit, compared on app mount)

## Frontend Architecture

### New Components

```
src/components/mascot/
├── FoxCompanion.tsx       # Main container, positioned fixed bottom-right
├── FoxAnimation.tsx       # SVG renderer with motion transitions between states
├── SpeechBubble.tsx       # Coaching tip bubble UI
├── sprites/               # SVG components for each fox state
│   ├── FoxIdle.tsx
│   ├── FoxAttentive.tsx
│   ├── FoxThinking.tsx
│   ├── FoxCelebrating.tsx
│   ├── FoxEncouraging.tsx
│   ├── FoxCoaching.tsx
│   ├── FoxSleepy.tsx
│   ├── FoxBrowsing.tsx
│   └── FoxWaving.tsx
├── fox-states.ts          # State enum, transition logic
└── use-fox-coach.ts       # Hook: calls /api/coach, caches responses

src/stores/
└── fox-store.ts           # Zustand store for fox state management
```

### Fox Store (Zustand)
- New Zustand store at `src/stores/fox-store.ts` (consistent with existing app-store and profile-store)
- Tracks: `currentState`, `speechBubbleText`, `isBubbleVisible`, `isHidden` (user preference)
- Exposes: `setFoxState()`, `showCoachingTip()`, `dismissBubble()`, `toggleHidden()`
- Pages and components call `setFoxState()` to trigger reactions
- Grading flow calls `showCoachingTip()` after results arrive
- Persists `isHidden` preference to localStorage

### Integration Points
- `App.tsx` — render `<FoxCompanion />` at the app root level (outside both `Layout.tsx` and `LandingLayout.tsx`) so the fox is visible on all pages including the landing page
- `GradingPage.tsx` — set fox to attentive on typing, thinking on submit
- `GradingPage.tsx` (essay input area) — notify fox store on typing start/stop
- `ResultsSummary.tsx` — trigger celebrating/encouraging + coaching after results
- `EssaysPage.tsx` — set fox to browsing state
- `LandingPage.tsx` — set fox to waving state

### Animation Assets
- SVG components stored in `src/components/mascot/sprites/` — one per fox state
- Animated using `motion` library (already in project) for transitions between states
- When designer-created Lottie assets are available, swap SVG components for Lottie player without changing the rest of the architecture
- Placeholder SVGs used during initial development (out of scope to create final art)

## Backend Architecture

### New Files
```
backend/app/routes/coach.py      # POST /api/coach endpoint
backend/app/services/coach.py    # CoachService: builds prompt, calls LLM
backend/app/schemas/coach.py     # Request/response Pydantic models
```

### Coach Service
- Accepts context trigger type + optional submission_id
- Looks up relevant data server-side from the authenticated user's submissions
- Computes history summary (total essays, avg score, weakest/strongest category, trend) from the database
- Builds a short system prompt with fox personality definition
- Builds user prompt with the computed context data
- Calls Claude Haiku with max_tokens=50
- Returns message string + suggested fox state
- Error handling: returns fallback message on any failure
- History summary cached in-memory per user (invalidated when new submissions are created)

## Accessibility
- Fox animations respect `prefers-reduced-motion` (static poses)
- Speech bubble is announced via `aria-live="polite"`
- Fox can be clicked via keyboard (focusable, Enter to toggle bubble)
- Speech bubble dismissable via Escape key
- Option in profile settings to hide the fox entirely

## Implementation Phasing

This spec covers two distinct efforts that should be implemented as separate phases:

1. **Phase A: Rebrand** — Rename from EssayGrader to Redpen (name, colors, logo, meta tags, landing page copy, header). Standalone, touches many existing files.
2. **Phase B: Fox Mascot** — Add the fox companion with reactive behaviors and LLM coaching. Additive feature, mostly new files.

Phase A should land first so Phase B builds on the new brand identity.

## Performance
- SVG sprite components are lightweight and inline (no network requests)
- Fox component lazy-loaded after initial page render
- Coaching API calls are debounced and cached
- Fox component uses `React.memo` to prevent unnecessary re-renders
- No impact on grading flow — coaching is async and non-blocking

## Out of Scope
- Creating the actual Lottie animation assets (placeholder SVGs during dev)
- Fox customization (outfits, colors) — future feature
- Fox naming — future feature
- Teacher-specific fox behaviors — future feature
