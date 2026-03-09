# AI Essay Grader

## What This Is

A frontend web application for AI-powered essay grading and feedback. Users submit essays with a rubric (PDF upload), receive rubric-aligned scores with structured feedback, and see color-coded essay passage highlighting linked to each feedback category — all in a side-by-side single-page interface. This is the React frontend — the backend (Python/FastAPI + fine-tuned Llama 3.2 3B) will be developed separately and integrated later.

## Core Value

Users can submit an essay with a rubric and immediately see clear, rubric-aligned scores with structured feedback and highlighted essay passages — all in a clean, scannable interface.

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
- ✓ Combined home/grade page with collapsible hero section — v1.1
- ✓ Side-by-side results layout (essay left, feedback right) — v1.1
- ✓ Essay passage highlighting linked to feedback categories (always visible, color-coded) — v1.1
- ✓ Editable essay in results view with resubmit — v1.1
- ✓ Mock email+password authentication on profile page — v1.1
- ✓ Two-tab navigation (Home / Profile) — v1.1

### Active

#### Current Milestone: v2.0 Backend Implementation

**Goal:** Build the full Python/FastAPI backend with model serving, database, auth, and Docker — replacing all mock data with real API integration.

**Target features:**
- FastAPI backend with endpoints matching current mock JSON format
- Llama 3.2 3B model inference with configurable endpoint (local/LAN/cloud GPU)
- PostgreSQL database for submissions, history, user accounts
- Real JWT authentication (registration, login, token-based sessions)
- Server-side rubric PDF parsing with text fallback
- Docker Compose for backend + DB
- Frontend integration to swap mock API for real backend

### Out of Scope

- Real authentication / OAuth — mock auth sufficient for demo
- Actual AI model integration — backend developed separately
- PDF export functionality — placeholder only
- Database / persistent storage — mock data only
- Plagiarism detection — not part of grading scope
- Multi-language support — English only
- Docker / deployment setup — comes later
- Mobile-optimized layout (<768px) — tablet minimum is sufficient
- Resizable/draggable split panes — fixed split sufficient for grading
- Rich text editing — grading evaluates plain text
- Character-level inline comments — passage-level highlighting sufficient

## Context

- Academic/course project: the frontend is the deliverable, backend comes later
- Backend will be Python/FastAPI serving a fine-tuned Llama 3.2 3B model
- UX redesign inspired by QuillBot AI Detector layout (side-by-side input + results)
- Rubric uploaded as PDF (replaced editable rubric editor in v1.0 redesign)
- All API interactions mocked with realistic placeholder data and simulated delays
- Mock API responses include highlight ranges (start, end, categoryId) for passage-level feedback
- Navigation: 2 tabs (Home, Profile), always visible, no hamburger menu
- **Current state:** 2,541 LOC across 38 TypeScript/TSX files. React + Vite + Tailwind + Zustand + motion.
- **Shipped:** v1.0 MVP + v1.1 UX Redesign (all frontend features complete with mock data)

## Constraints

- **Tech stack**: React (Vite + TypeScript), Tailwind CSS, React Router v7, Axios, Zustand, motion
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
| Combined home + grading into single page | Reduces friction, inspired by QuillBot/AI checker tools | ✓ Good |
| Hero collapses (hides) on input focus | Keeps grading area prominent once user starts working; full hide instead of minimal bar since header has branding | ✓ Good |
| Side-by-side results with essay highlighting | Shows feedback in context of the essay text | ✓ Good |
| Always-on passage highlighting | No click/hover needed — all feedback-linked passages color-coded by category | ✓ Good |
| Mock email+password auth | Realistic sign-in screen without real auth complexity | ✓ Good |
| Two-tab navigation (Home/Profile) | Simplifies nav now that home and grading are merged | ✓ Good |
| HighlightProvider keyed by result.id | Forces clean re-mount on re-grade, prevents stale highlight state | ✓ Good |
| motion library for hero animation | Lightweight, AnimatePresence handles exit animations cleanly | ✓ Good |
| Bidirectional hover via shared context | activeCategoryId/activeHighlightId in HighlightProvider enables card↔highlight interaction without prop drilling | ✓ Good |

---
*Last updated: 2026-03-09 after v2.0 milestone started*
