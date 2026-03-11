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
- **Lottie** (lottie-react) for smooth vector animations
- Each fox state is a separate Lottie animation file
- Transitions between states use crossfade or morph
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

### Speech Bubble
- Appears above the fox, pointing down to it
- Max width ~250px, rounded corners, subtle shadow
- Text is 1-2 short sentences, casual tone
- Dismiss button (small X) or click-away to close
- Auto-dismisses after 10 seconds if not interacted with
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

**`POST /api/coach`**

Request:
```json
{
  "context": "results_received",
  "recent_scores": [
    {"category": "thesis", "score": 18, "max": 25},
    {"category": "evidence", "score": 22, "max": 25}
  ],
  "overall_score": 72,
  "max_score": 100,
  "essay_excerpt": "first 200 chars of essay...",
  "history_summary": {
    "total_essays": 12,
    "avg_score": 68,
    "weakest_category": "thesis",
    "strongest_category": "evidence",
    "trend": "improving"
  }
}
```

Response:
```json
{
  "message": "Your evidence game is strong! Let's work on making your thesis statements punchier next time.",
  "fox_state": "coaching"
}
```

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
5. **First visit of the day** — greeting + encouragement

## Frontend Architecture

### New Components

```
src/components/mascot/
├── FoxCompanion.tsx       # Main container, positioned fixed bottom-right
├── FoxAnimation.tsx       # Lottie player, handles state transitions
├── SpeechBubble.tsx       # Coaching tip bubble UI
├── fox-states.ts          # State enum, transition logic
└── use-fox-coach.ts       # Hook: calls /api/coach, caches responses
```

### FoxStateProvider Context
- Wraps the app at root layout level
- Tracks: `currentState`, `speechBubbleText`, `isBubbleVisible`
- Exposes: `setFoxState()`, `showCoachingTip()`, `dismissBubble()`
- Pages and components call `setFoxState()` to trigger reactions
- Grading flow calls `showCoachingTip()` after results arrive

### Integration Points
- `Layout.tsx` — render `<FoxCompanion />` as last child (above content, below modals)
- `GradingPage.tsx` — set fox to attentive on typing, thinking on submit
- `EssayInput.tsx` — notify fox context on typing start/stop
- `ResultsSummary.tsx` — trigger celebrating/encouraging + coaching after results
- `EssaysPage.tsx` — set fox to browsing state
- `LandingPage.tsx` — set fox to waving state

### Animation Assets
- Lottie JSON files stored in `public/animations/fox/`
- One file per state: `idle.json`, `attentive.json`, `thinking.json`, `celebrating.json`, `encouraging.json`, `coaching.json`, `sleepy.json`, `browsing.json`, `waving.json`
- Assets need to be created by a designer or generated (out of scope for this spec, placeholder SVGs used during development)

## Backend Architecture

### New Files
```
backend/app/routes/coach.py      # POST /api/coach endpoint
backend/app/services/coach.py    # CoachService: builds prompt, calls LLM
backend/app/schemas/coach.py     # Request/response Pydantic models
```

### Coach Service
- Accepts context (scores, history summary, current page)
- Builds a short system prompt with fox personality definition
- Builds user prompt with the context data
- Calls Claude Haiku with max_tokens=50
- Returns message string + suggested fox state
- Error handling: returns fallback message on any failure

### History Summary Helper
- New utility to compute aggregate stats from a user's submissions
- Total essays, average score, weakest/strongest category, trend (improving/declining/stable)
- Called by the coach endpoint, cached per user per session

## Accessibility
- Fox animations respect `prefers-reduced-motion` (static poses)
- Speech bubble is announced via `aria-live="polite"`
- Fox can be clicked via keyboard (focusable, Enter to toggle bubble)
- Speech bubble dismissable via Escape key
- Option in profile settings to hide the fox entirely

## Performance
- Lottie files are lightweight (~10-50KB each)
- Lazy-loaded after initial page render
- Coaching API calls are debounced and cached
- Fox component uses `React.memo` to prevent unnecessary re-renders
- No impact on grading flow — coaching is async and non-blocking

## Out of Scope
- Creating the actual Lottie animation assets (placeholder SVGs during dev)
- Fox customization (outfits, colors) — future feature
- Fox naming — future feature
- Teacher-specific fox behaviors — future feature
