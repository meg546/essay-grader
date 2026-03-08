# Roadmap: AI Essay Grader

## Overview

This roadmap delivers a React/TypeScript frontend for AI-powered essay grading. The journey moves bottom-up through the dependency chain: types and mock API first, then the input experience (essay + rubric), then submission mechanics, then results display, and finally history and landing page. Each phase delivers a coherent, verifiable capability that builds on the previous one.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & API Layer** - Project scaffolding, design system, mock API with typed contracts, routing, and responsive layout shell
- [ ] **Phase 2: Essay Input & Rubric Editor** - Complete input experience: essay textarea, file upload with PDF extraction, and fully editable rubric
- [ ] **Phase 3: Submission Flow** - Submit essay + rubric for grading with loading state and redirect to results
- [ ] **Phase 4: Results Display** - Per-category scores, color-coded bars, structured feedback, and aggregate scoring
- [ ] **Phase 5: History, Landing & Polish** - Submission history table, landing page, and dark mode toggle
- [ ] **Phase 6: E2E Testing** - Comprehensive Playwright end-to-end tests covering all success criteria from phases 1-5

## Phase Details

### Phase 1: Foundation & API Layer
**Goal**: Developers have a fully scaffolded, styled project with typed mock API functions, routing between all pages, and a responsive layout shell that establishes the visual identity
**Depends on**: Nothing (first phase)
**Requirements**: API-01, API-02, API-03, NAVL-02, NAVL-04, NAVL-05
**Success Criteria** (what must be TRUE):
  1. Running `npm run dev` serves the app with a visible layout shell (header, content area) styled with the project's calm, education-focused color palette
  2. User can navigate between all four page routes (landing, grading, results, history) via header navigation, each showing a placeholder
  3. Layout responds correctly at 768px tablet breakpoint without horizontal scrolling or broken elements
  4. Calling any mock API function (e.g., `gradeEssay()`) returns typed data after a visible simulated delay
**Plans**: 2 plans

Plans:
- [ ] 01-01-PLAN.md — Scaffold project, design system, layout shell, routing, and skeleton placeholder pages
- [ ] 01-02-PLAN.md — Typed mock API service layer with simulated delays and Zustand store

### Phase 2: Essay Input & Rubric Editor
**Goal**: Users can compose or upload an essay and customize a grading rubric, completing the entire input side of the grading workflow
**Depends on**: Phase 1
**Requirements**: INPT-01, INPT-02, INPT-03, INPT-04, RUBR-01, RUBR-02, RUBR-03, RUBR-04, RUBR-05
**Success Criteria** (what must be TRUE):
  1. User can paste text into the essay textarea and see live word and character counts update
  2. User can upload a .txt or .pdf file (via click or drag-and-drop) and see the extracted text appear in the textarea with a preview
  3. User sees the default ASAP rubric (4 categories, 0-6 scales) pre-populated on the grading page
  4. User can rename categories, add new categories, remove categories, adjust max scores, and reset everything back to ASAP defaults
  5. Rubric and essay state persist in Zustand stores across navigation (navigating away and back preserves input)
**Plans**: 2 plans

Plans:
- [ ] 02-01-PLAN.md — Install dependencies, extend Zustand store with essay/rubric state, create PDF extraction utility
- [ ] 02-02-PLAN.md — Build EssayInput, RubricEditor, RubricCategoryRow components and compose GradingPage

### Phase 3: Submission Flow
**Goal**: Users can submit their essay and rubric for grading and experience a polished loading-to-results transition
**Depends on**: Phase 2
**Requirements**: SUBM-01, SUBM-02, SUBM-03
**Success Criteria** (what must be TRUE):
  1. User can click "Submit for Grading" with essay text and rubric present, triggering the mock API call
  2. User sees a loading animation during the simulated grading delay (no frozen or blank screen)
  3. User is automatically redirected to the results page when grading completes, with results visible
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

### Phase 4: Results Display
**Goal**: Users can read and understand their grading results through clear scores, color-coded visualizations, and structured per-category feedback
**Depends on**: Phase 3
**Requirements**: RSLT-01, RSLT-02, RSLT-03, RSLT-04
**Success Criteria** (what must be TRUE):
  1. User sees an overall summary paragraph at the top of the results page describing the essay's performance
  2. User sees per-category score bars that are color-coded (green for high, yellow for medium, red for low scores)
  3. User sees an aggregate/total score combining all category scores
  4. User can expand and collapse per-category feedback sections showing strengths, areas for improvement, and score justification
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

### Phase 5: History, Landing & Polish
**Goal**: Users have a complete application with a welcoming landing page, browsable submission history, and dark mode support
**Depends on**: Phase 4
**Requirements**: HIST-01, HIST-02, NAVL-01, NAVL-03
**Success Criteria** (what must be TRUE):
  1. User sees a landing page with project description and a clear "Start Grading" call-to-action that navigates to the grading page
  2. User can view a submission history table showing 5-8 past graded essays with key metadata (title, date, score)
  3. User can click any history row to navigate to and view that submission's full results
  4. User can toggle dark mode and see the entire UI switch to a dark color scheme
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

### Phase 6: E2E Testing
**Goal**: Comprehensive Playwright end-to-end test suite that automatically verifies all user-facing success criteria from phases 1-5
**Depends on**: Phase 5
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05
**Success Criteria** (what must be TRUE):
  1. Playwright is installed and configured with `npm run test:e2e` running the full suite
  2. Navigation tests verify all 4 routes are accessible and header nav works
  3. Input tests verify essay paste with word count, file upload, and rubric editing (add/remove/rename/reset)
  4. Submission flow tests verify loading state appears and redirect to results occurs
  5. Results tests verify score bars, aggregate score, summary paragraph, and collapsible feedback sections
  6. History tests verify table renders mock entries and clicking a row navigates to results
  7. Dark mode test verifies toggle switches the UI theme
  8. All tests pass in CI-compatible headless mode
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & API Layer | 2/2 | Complete | 2026-03-08 |
| 2. Essay Input & Rubric Editor | 0/2 | Planning complete | - |
| 3. Submission Flow | 0/? | Not started | - |
| 4. Results Display | 0/? | Not started | - |
| 5. History, Landing & Polish | 0/? | Not started | - |
| 6. E2E Testing | 0/? | Not started | - |
