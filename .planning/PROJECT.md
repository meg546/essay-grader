# AI Essay Grader

## What This Is

A frontend web application for AI-powered essay grading and feedback. Instructors submit student essays along with a grading rubric and receive rubric-aligned numerical scores plus structured, actionable written feedback. This is the React frontend — the backend (Python/FastAPI + fine-tuned Llama 3.2 3B) will be developed separately and integrated later.

## Core Value

Instructors can submit an essay with a rubric and immediately see clear, rubric-aligned scores with structured feedback (strengths, improvements, justification) — all in a clean, scannable interface.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Landing page with project description and navigation to grading
- [ ] Essay input via paste (large text area) or file upload (.txt, .pdf) with word/character count
- [ ] Editable rubric with default ASAP categories (Content & Ideas, Organization, Style/Voice, Language Conventions) on 0–6 scales
- [ ] Add/remove rubric categories and adjust max scores, with reset-to-default
- [ ] Submission flow with loading state and simulated delay
- [ ] Results page with per-category score bars (color-coded green/yellow/red)
- [ ] Aggregate/total score display
- [ ] Per-category structured feedback: strengths, areas for improvement, score justification in collapsible sections
- [ ] Overall summary paragraph at top of feedback
- [ ] Submission history page with table of past submissions (mocked, 5–8 entries)
- [ ] Clickable history rows navigating to individual results
- [ ] API layer structured for easy backend swap (mock data behind async functions)
- [ ] Clean, professional, education-focused design with calm color palette
- [ ] Responsive down to tablet

### Out of Scope

- Authentication / user accounts — not needed for course project demo
- Actual AI model integration — backend developed separately
- PDF export functionality — button placeholder only
- Database / persistent storage — mock data only
- Plagiarism detection — not part of grading scope
- Multi-language support — English only
- Docker / deployment setup — comes later
- Mobile-optimized layout — tablet minimum is sufficient

## Context

- Academic/course project: the frontend is the deliverable, backend comes later
- Backend will be Python/FastAPI serving a fine-tuned Llama 3.2 3B model
- Rubric structure inspired by the ASAP (Automated Student Assessment Prize) dataset
- All API interactions mocked with realistic placeholder data and simulated delays
- API layer designed so swapping in real Axios calls requires only changing function bodies

## Constraints

- **Tech stack**: React (Vite + TypeScript), Tailwind CSS, React Router v6, Axios, Zustand
- **Package manager**: npm
- **API base URL**: `http://localhost:8000/api` (future FastAPI backend)
- **No Redux**: Zustand for state management at this scale
- **Mock-first**: All backend interactions return mock data behind simulated async delays

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Zustand over React Context | Cleaner store API, scales better if state grows, minimal boilerplate | — Pending |
| Mock data behind typed async API functions | Enables seamless backend swap later — only function bodies change | — Pending |
| Default ASAP rubric with editable categories | Provides sensible defaults while allowing instructor customization | — Pending |
| Collapsible per-category feedback sections | Keeps results page scannable while preserving detail | — Pending |

---
*Last updated: 2026-03-08 after initialization*
