# Project Research Summary

**Project:** AI Essay Grader (Frontend)
**Domain:** Education technology -- AI-assisted essay grading SPA with mock-first backend
**Researched:** 2026-03-08
**Confidence:** HIGH

## Executive Summary

This is a React/TypeScript single-page application that lets instructors submit essays against customizable rubrics and receive AI-generated scores and feedback. The frontend is built mock-first: all API interactions go through typed async functions that return realistic fake data now and will swap to real FastAPI backend calls later by changing only function bodies. The stack is fully constrained by project requirements (React 19, Vite 7, TypeScript, Zustand, Tailwind v4, React Router v6, Axios) and all choices are current, stable, and well-documented.

The recommended approach is a layered architecture built bottom-up: types and utilities first, then API abstraction with mocks, then Zustand stores, then shared UI components, then page-level orchestration. The critical architectural decision is the mock-first API layer with typed contracts -- this is what makes the frontend independently demonstrable while remaining production-ready for backend integration. Feature-wise, the core loop is simple (input essay + rubric, submit, view results) but the rubric editor and results display carry meaningful complexity.

The top risks are: (1) mock data that does not reflect real AI output variability, making backend integration painful; (2) rubric editor state becoming a tangled mess if not normalized from the start; and (3) PDF file upload silently failing because developers assume `FileReader.readAsText()` works on binary PDF files. All three are preventable with upfront design decisions in the first two phases.

## Key Findings

### Recommended Stack

The entire stack is project-constrained and current. No version conflicts or compatibility concerns exist. Tailwind v4 is the only technology with a significantly different setup from its predecessor (CSS-first config, no `tailwind.config.js`, uses `@import "tailwindcss"` and `@tailwindcss/vite` plugin).

**Core technologies:**
- **React 19 + TypeScript 5.9 + Vite 7:** Project constraints, all stable and current. Vite scaffolds the project with `npm create vite@latest`
- **React Router v6 (6.30.3):** Pin to v6 explicitly; v7 merges Remix concepts and is overkill for 4 routes
- **Zustand 5:** Minimal boilerplate state management. One store per domain (rubric, essay, results, history). No Redux ceremony
- **Tailwind CSS v4 + @tailwindcss/vite:** CSS-first configuration, auto-detects content sources. Pair with `clsx` + `tailwind-merge` via a `cn()` utility
- **Axios:** Project constraint for HTTP client. Mock at the function level above Axios, not with interceptors
- **pdfjs-dist:** Required for client-side PDF text extraction. Must be dynamically imported to avoid 2MB+ initial bundle bloat
- **react-dropzone:** De facto standard for file upload UIs. Handles drag-and-drop, type validation, accessibility

**Key version note:** Tailwind v4 is a breaking change from v3. Do not follow v3 tutorials for config -- there is no config file.

### Expected Features

**Must have (table stakes):**
- Essay text input via paste (textarea) with word/character count
- File upload for .txt and .pdf with text extraction
- Editable rubric with ASAP default categories (Content, Organization, Style, Conventions) on 0-6 scales
- Submission flow with loading animation and simulated delay
- Results page: per-category color-coded score bars, aggregate score, overall summary, per-category structured feedback (strengths/improvements/justification) in collapsible sections
- Submission history table with clickable rows to view past results
- Landing page with project description
- Responsive layout down to tablet (768px)
- Mock API layer with typed async functions

**Should have (differentiators, add if time permits):**
- Rubric templates/presets (argumentative, narrative, expository, research) -- low effort, high demo polish
- Side-by-side essay + feedback view on results page
- Feedback tone selector (encouraging/balanced/critical)
- Dark mode toggle (easy with Tailwind if `dark:` classes used from start)
- PDF export button (placeholder or basic react-to-print)

**Defer (v2+):**
- Inline text highlighting with feedback annotations (requires real AI span data)
- Score comparison/analytics visualization (meaningless with mock data)
- Batch/multi-essay upload (significant complexity)
- Real backend integration

**Anti-features (do not build):** Real-time collaboration, plagiarism detection, student portal, analytics dashboard, mobile-optimized layout.

### Architecture Approach

Feature-sliced folder structure with clear separation: `api/` for backend abstraction, `stores/` for Zustand state, `components/` for reusable UI (no store access), `pages/` for route-level orchestration, `hooks/` for multi-step logic, `types/` for shared interfaces. Data flows down via props, actions flow up via callbacks, state lives in stores, API calls happen in hooks. Components never call the API layer directly.

**Major components:**
1. **API Layer (api/):** Typed async functions returning domain objects. Mock implementations in `api/mock/`. Swap to real Axios calls by changing function bodies only
2. **Zustand Stores (stores/):** Four independent stores -- rubric, essay, results, history. No cross-store dependencies. Coordination happens in hooks/pages
3. **Pages (pages/):** Four route-level components (Landing, Grading, Results, History). Only pages access stores directly. Shared components receive data via props
4. **Shared Components (components/):** UI primitives (Button, Card, Input), layout (Shell, Header), domain-specific display (ScoreBar, FeedbackSection, RubricEditor, EssayInput, FileUpload)
5. **Custom Hooks (hooks/):** Orchestrate multi-step flows like `useSubmitEssay` (set loading -> call API -> store result -> clear loading)

### Critical Pitfalls

1. **Mock data that lies about the real API shape** -- Define TypeScript interfaces first, create at least 3 response variants (best-case, typical, edge-case), include empty strings, very long feedback, boundary scores. Address in Phase 1.
2. **Rubric editor state becomes unmanageable** -- Use normalized Zustand store with stable IDs (not array indices), single canonical Rubric type used everywhere (editor, submission, results), immutable updates. Address in Phase 2.
3. **PDF upload silently fails** -- Use `pdfjs-dist` for PDF text extraction, not `FileReader.readAsText()`. Handle corrupted files, scanned-image PDFs, password-protected PDFs. Show preview of extracted text. Address in Phase 2.
4. **Results page missing essay context** -- Store submitted essay text in the results data model so instructors can cross-reference feedback against the original essay. Address in Phase 2 (data model) and Phase 3 (UI).
5. **Score visualization misrepresents AI confidence** -- Label scores as "Suggested," use percentage-based color thresholds (not absolute), surface justification text alongside scores rather than hiding it. Address in Phase 3.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Project Foundation and API Layer
**Rationale:** The architecture has clear dependency layers. Types, utilities, and the API abstraction must exist before any UI work. The mock-first API layer is the most architecturally important decision in this project -- getting it right prevents the top-ranked pitfall (mock data shape mismatch).
**Delivers:** Scaffolded Vite project, Tailwind v4 configured, TypeScript interfaces for all domain types (Essay, Rubric, GradingResult, CategoryScore, Feedback), API abstraction with mock implementations (3+ response variants), Axios client instance, simulated delay helper, `cn()` utility, base layout shell (Header, Footer, PageContainer), route definitions.
**Addresses:** Mock API layer (P1 feature), clean professional UI foundation
**Avoids:** Pitfall 1 (mock data shape mismatch), Pitfall on `any` types and inline mock data

### Phase 2: Core Input Experience
**Rationale:** The rubric and essay input are the foundational features -- every scoring and feedback feature depends on having rubric categories defined, and the submission flow requires essay text. This phase builds the entire left side of the user journey (input -> submit).
**Delivers:** Essay text input (paste textarea with word count), file upload (.txt and .pdf with `pdfjs-dist` extraction), rubric editor (add/remove/rename categories, adjust scales, reset to defaults, ASAP defaults), Zustand stores for essay and rubric state, submission flow with loading animation, `useSubmitEssay` hook.
**Addresses:** Essay text input (P1), file upload (P1), editable rubric (P1), submission flow (P1), loading state (P1)
**Avoids:** Pitfall 2 (rubric state tangle), Pitfall 4 (PDF upload broken), Pitfall on rubric editor validation

### Phase 3: Results Display
**Rationale:** With input and submission working, the results page is the payoff. This is where the grading output is presented. Must include essay context (not just scores) and frame AI scores as suggestions.
**Delivers:** Results page with overall summary, per-category score bars (color-coded, percentage-based thresholds), per-category structured feedback in collapsible sections, aggregate score, access to original essay text from results page, "Suggested score" framing, results Zustand store.
**Addresses:** Per-category scores (P1), aggregate score (P1), per-category feedback (P1), overall summary (P1), responsive layout (P1)
**Avoids:** Pitfall 3 (results page missing essay), Pitfall 5 (misleading score visualization)

### Phase 4: History and Landing
**Rationale:** History depends on the results page existing (history rows link to results). Landing page is low complexity but important for demo first impressions. These are the remaining P1 features.
**Delivers:** Submission history table with mock entries, clickable rows navigating to individual results, empty state handling, history Zustand store, landing page with project description and "Start Grading" CTA.
**Addresses:** Submission history (P1), landing page (P1)
**Avoids:** Pitfall on history page empty state and missing preview data

### Phase 5: Polish and Differentiators
**Rationale:** With all P1 features complete, this phase adds the low-effort, high-impact differentiators that elevate the demo. These are independent features that do not affect the core architecture.
**Delivers:** Rubric templates/presets, side-by-side essay + feedback view, feedback tone selector, dark mode toggle, PDF export placeholder, navigation guards for unsaved rubric edits, error state handling for failed submissions.
**Addresses:** All P2 features (rubric templates, side-by-side view, tone selector, dark mode, PDF export)
**Avoids:** Scope creep into v2+ features (inline highlighting, batch upload, analytics)

### Phase Ordering Rationale

- **Bottom-up dependency chain:** Types -> API -> Stores -> Components -> Pages. This mirrors the architecture's layer model and prevents rework.
- **Rubric before results:** Every scoring feature depends on rubric categories. The rubric data model shapes the API contract, the submission payload, and the results display.
- **PDF in Phase 2, not deferred:** Research is clear that deferring PDF parsing leads to silent failures. Handle it alongside essay input.
- **History after results:** History rows link to individual results pages. The results page must exist first.
- **Polish last:** Differentiator features (templates, dark mode, side-by-side) are additive and do not change the core architecture.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Core Input):** PDF text extraction with `pdfjs-dist` has specific setup requirements (worker configuration, dynamic import pattern). Research the exact Vite + pdfjs-dist integration before implementation.
- **Phase 5 (Polish):** Side-by-side essay + feedback view has layout complexity. Research split-pane patterns if pursuing this feature.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Vite + React + Tailwind v4 + Zustand + React Router v6 setup is fully documented. Stack research already provides installation commands and config snippets.
- **Phase 3 (Results Display):** Score bars, collapsible sections, and color coding are standard UI patterns. No exotic libraries needed.
- **Phase 4 (History and Landing):** Simple table display and static landing page. Well-trodden patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified via npm registry. Every technology is a project constraint with no ambiguity. Tailwind v4 setup confirmed. |
| Features | MEDIUM | Based on training data knowledge of Turnitin, Gradescope, CoGrader. Competitor features may have changed post-May 2025. Core feature list is sound. |
| Architecture | HIGH | Standard React/TypeScript patterns applied to a well-scoped project. Mock-first API layer is a widely documented pattern. |
| Pitfalls | MEDIUM | Domain-informed but not verified against current documentation. PDF parsing and Zustand patterns should be validated during implementation. |

**Overall confidence:** HIGH -- the project is well-constrained, the stack is fully specified, and the architecture follows established patterns. The MEDIUM confidence areas (features, pitfalls) do not introduce blocking uncertainty.

### Gaps to Address

- **pdfjs-dist + Vite integration details:** The exact worker configuration for pdf.js in a Vite project needs validation. Dynamic import pattern is known but Vite-specific bundling behavior should be tested early in Phase 2.
- **Tailwind v4 dark mode setup:** Tailwind v4 changed how dark mode works (CSS-first). Confirm the exact `dark:` variant behavior before Phase 5 dark mode implementation.
- **Mock data realism:** No real FastAPI backend spec exists yet. Mock data shapes are based on reasonable assumptions about LLM grading output. When the backend spec materializes, mock types may need adjustment -- but the API layer architecture makes this a low-cost change.
- **Zustand v5 API nuances:** Zustand v5 dropped some v4 patterns. Confirm the `create<StoreType>()((set) => ...)` syntax works as expected during Phase 1 scaffolding.

## Sources

### Primary (HIGH confidence)
- npm registry (direct version checks, verified 2026-03-08) -- all package versions
- Tailwind CSS v4 release notes -- setup and migration patterns
- React Router v6/v7 version split -- confirmed via npm

### Secondary (MEDIUM confidence)
- Training data knowledge of Turnitin, Gradescope, CoGrader, EssayGrader.ai -- feature landscape and competitor analysis
- React/TypeScript architecture patterns -- community conventions
- Zustand documentation patterns -- store-per-domain approach
- Mozilla pdf.js documentation patterns -- PDF parsing integration

### Tertiary (LOW confidence)
- Specific competitor feature details post-May 2025 -- may have changed, not blocking

---
*Research completed: 2026-03-08*
*Ready for roadmap: yes*
