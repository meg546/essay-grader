# AI Essay Grader

## What This Is

A frontend web application for AI-powered essay grading and feedback. Users submit student essays along with a rubric (uploaded as PDF) and receive rubric-aligned numerical scores plus structured, actionable written feedback with inline essay highlighting. This is the React frontend — the backend (Python/FastAPI + fine-tuned Llama 3.2 3B) will be developed separately and integrated later.

## Core Value

Users can submit an essay with a rubric and immediately see clear, rubric-aligned scores with structured feedback and highlighted essay passages — all in a clean, scannable interface.

## Current Milestone: v1.1 UX Redesign

**Goal:** Transform the app into a polished, single-page grading experience with combined home/grade view, side-by-side results with essay highlighting, and mock authentication.

**Target features:**
- Combined home + grading page (hero collapses on input focus, QuillBot-style layout)
- Side-by-side results view: editable essay on left, grades/feedback on right
- Always-on color-coded essay passage highlighting linked to feedback categories
- Editable essay with resubmit capability from results view
- Profile page with email+password sign-in screen (mock auth)
- Two-tab navigation: Home / Profile

## Requirements

### Validated

- ✓ Essay input via paste or file upload with word/character count — v1.0
- ✓ Rubric upload (PDF) with drag-and-drop — v1.0
- ✓ Submission flow with loading state — v1.0
- ✓ Per-category score bars (color-coded) — v1.0
- ✓ Aggregate/total score display — v1.0
- ✓ Per-category structured feedback (strengths, improvements, justification) — v1.0
- ✓ Overall summary paragraph — v1.0
- ✓ Submission history with clickable entries — v1.0
- ✓ API layer structured for easy backend swap — v1.0
- ✓ Clean, professional, education-focused design — v1.0
- ✓ Responsive down to tablet — v1.0
- ✓ Profile page with grade level settings — v1.0
- ✓ Inline results display on grading page — v1.0

### Active

- [ ] Combined home/grade page with collapsible hero section
- [ ] Side-by-side results layout (essay left, feedback right)
- [ ] Essay passage highlighting linked to feedback categories (always visible, color-coded)
- [ ] Editable essay in results view with resubmit
- [ ] Mock email+password authentication on profile page
- [ ] Two-tab navigation (Home / Profile)

### Out of Scope

- Real authentication / OAuth — mock auth sufficient for demo
- Actual AI model integration — backend developed separately
- PDF export functionality — placeholder only
- Database / persistent storage — mock data only
- Plagiarism detection — not part of grading scope
- Multi-language support — English only
- Docker / deployment setup — comes later
- Mobile-optimized layout — tablet minimum is sufficient

## Context

- Academic/course project: the frontend is the deliverable, backend comes later
- Backend will be Python/FastAPI serving a fine-tuned Llama 3.2 3B model
- UX redesign inspired by QuillBot AI Detector layout (side-by-side input + results)
- Rubric uploaded as PDF (replaced editable rubric editor in v1.0 redesign)
- All API interactions mocked with realistic placeholder data and simulated delays
- Mock API responses need to include passage references for essay highlighting
- Navigation consolidated from 3 tabs to 2 tabs (Home, Profile)

## Constraints

- **Tech stack**: React (Vite + TypeScript), Tailwind CSS, React Router v7, Axios, Zustand
- **Package manager**: npm
- **API base URL**: `http://localhost:8000/api` (future FastAPI backend)
- **No Redux**: Zustand for state management at this scale
- **Mock-first**: All backend interactions return mock data behind simulated async delays

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Zustand over React Context | Cleaner store API, scales better if state grows, minimal boilerplate | ✓ Good |
| Mock data behind typed async API functions | Enables seamless backend swap later — only function bodies change | ✓ Good |
| Replaced editable rubric with PDF upload | Simpler UX, rubric processing handled by backend AI | ✓ Good |
| Combined home + grading into single page | Reduces friction, inspired by QuillBot/AI checker tools | — Pending |
| Hero collapses on input focus | Keeps grading area prominent once user starts working | — Pending |
| Side-by-side results with essay highlighting | Shows feedback in context of the essay text | — Pending |
| Always-on passage highlighting | No click/hover needed — all feedback-linked passages color-coded by category | — Pending |
| Mock email+password auth | Realistic sign-in screen without real auth complexity | — Pending |
| Two-tab navigation (Home/Profile) | Simplifies nav now that home and grading are merged | — Pending |

---
*Last updated: 2026-03-08 after v1.1 milestone initialization*
