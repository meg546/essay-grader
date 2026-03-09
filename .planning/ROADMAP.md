# Roadmap: AI Essay Grader

## Milestones

- v1.0 MVP - Phases 1-6 (shipped)
- v1.1 UX Redesign - Phases 7-10 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>v1.0 MVP (Phases 1-6) - SHIPPED</summary>

- [x] **Phase 1: Foundation & API Layer** - Project scaffolding, design system, mock API with typed contracts, routing, and responsive layout shell
- [x] **Phase 2: Essay Input & Rubric Editor** - Complete input experience: essay textarea, file upload with PDF extraction, and fully editable rubric
- [x] **Phase 3: Submission Flow** - Submit essay + rubric for grading with loading state and redirect to results
- [x] **Phase 4: Results Display** - Per-category scores, color-coded bars, structured feedback, and aggregate scoring
- [x] **Phase 5: History, Landing & Polish** - Submission history table, landing page, and dark mode toggle
- [x] **Phase 6: E2E Testing** - Comprehensive Playwright end-to-end tests covering all success criteria from phases 1-5

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
- [x] 01-01-PLAN.md
- [x] 01-02-PLAN.md

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
- [x] 02-01-PLAN.md
- [x] 02-02-PLAN.md

### Phase 3: Submission Flow
**Goal**: Users can submit their essay and rubric for grading and experience a polished loading-to-results transition
**Depends on**: Phase 2
**Requirements**: SUBM-01, SUBM-02, SUBM-03
**Success Criteria** (what must be TRUE):
  1. User can click "Submit for Grading" with essay text and rubric present, triggering the mock API call
  2. User sees a loading animation during the simulated grading delay (no frozen or blank screen)
  3. User is automatically redirected to the results page when grading completes, with results visible
**Plans**: 1 plan

Plans:
- [x] 03-01-PLAN.md

### Phase 4: Results Display
**Goal**: Users can read and understand their grading results through clear scores, color-coded visualizations, and structured per-category feedback
**Depends on**: Phase 3
**Requirements**: RSLT-01, RSLT-02, RSLT-03, RSLT-04
**Success Criteria** (what must be TRUE):
  1. User sees an overall summary paragraph at the top of the results page describing the essay's performance
  2. User sees per-category score bars that are color-coded (green for high, yellow for medium, red for low scores)
  3. User sees an aggregate/total score combining all category scores
  4. User can expand and collapse per-category feedback sections showing strengths, areas for improvement, and score justification
**Plans**: 1 plan

Plans:
- [x] 04-01-PLAN.md

### Phase 5: History, Landing & Polish
**Goal**: Users have a complete application with a welcoming landing page, browsable submission history, and dark mode support
**Depends on**: Phase 4
**Requirements**: HIST-01, HIST-02, NAVL-01, NAVL-03
**Plans**: 2 plans

Plans:
- [x] 05-01-PLAN.md
- [x] 05-02-PLAN.md

### Phase 6: E2E Testing
**Goal**: Comprehensive Playwright end-to-end test suite that automatically verifies all user-facing success criteria from phases 1-5
**Depends on**: Phase 5
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05
**Plans**: 2 plans

Plans:
- [x] 06-01-PLAN.md
- [x] 06-02-PLAN.md

</details>

### v1.1 UX Redesign (In Progress)

**Milestone Goal:** Transform the app into a polished, single-page grading experience with combined home/grade view, side-by-side results with essay highlighting, and mock authentication.

- [ ] **Phase 7: Data Contracts & Route Restructure** - Mock API highlight schema, two-tab navigation, layout width fix
- [ ] **Phase 8: Collapsible Hero & Grading Workspace** - Combined home/grade page with hero that collapses on input focus
- [ ] **Phase 9: Side-by-Side Results & Highlighting** - Two-column results layout with always-on color-coded essay highlighting
- [ ] **Phase 10: Mock Auth & Editable Essay** - Email/password sign-in on profile, editable essay with resubmit from results view

## Phase Details

### Phase 7: Data Contracts & Route Restructure
**Goal**: The app's data layer and navigation are ready for all v1.1 features
**Depends on**: Phase 6 (v1.0 complete)
**Requirements**: HLGT-01, NAV-01, NAV-02
**Success Criteria** (what must be TRUE):
  1. Mock API grading responses include highlight ranges (start, end, categoryId) for every feedback category
  2. Navigation shows exactly two tabs: Home and Profile
  3. Home tab loads the combined grading page; Profile tab loads the profile/auth page
  4. Layout container no longer constrains width at 960px (side-by-side layout unblocked)
**Plans**: 2 plans

Plans:
- [ ] 07-01-PLAN.md — Highlight data contract and mock data
- [ ] 07-02-PLAN.md — Route consolidation, navigation simplification, layout width fix

### Phase 8: Collapsible Hero & Grading Workspace
**Goal**: Users experience a seamless single-page flow from landing to grading
**Depends on**: Phase 7
**Requirements**: LAYOUT-01, LAYOUT-02
**Success Criteria** (what must be TRUE):
  1. User sees hero section with app title, description, and grading inputs on the home page
  2. Hero collapses to a minimal bar when user focuses on the essay input textarea
  3. Hero remains collapsed while user is actively working in the grading area
**Plans**: 1 plan

Plans:
- [ ] 08-01-PLAN.md — Install Motion, create HeroSection, integrate collapsible hero into GradingPage

### Phase 9: Side-by-Side Results & Highlighting
**Goal**: Users see grading feedback in direct context with their essay text, with visual links between feedback and passages
**Depends on**: Phase 7, Phase 8
**Requirements**: LAYOUT-03, LAYOUT-04, HLGT-02, HLGT-03, HLGT-04, HLGT-05
**Success Criteria** (what must be TRUE):
  1. After grading, essay displays on the left and feedback/scores display on the right in a two-column layout
  2. Side-by-side layout stacks vertically on screens narrower than 1024px
  3. Essay passages are always color-coded by feedback category (no click/hover required to see highlights)
  4. Clicking a feedback card scrolls the essay panel to the corresponding highlighted passage
  5. Hovering a feedback card pulses the corresponding highlight (and vice versa), with a visible color legend and per-category toggles
**Plans**: TBD

Plans:
- [ ] 09-01: TBD
- [ ] 09-02: TBD
- [ ] 09-03: TBD

### Phase 10: Mock Auth & Editable Essay
**Goal**: Users can sign in with mock credentials and edit/resubmit essays without leaving the results view
**Depends on**: Phase 8, Phase 9
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, EDIT-01, EDIT-02, EDIT-03
**Success Criteria** (what must be TRUE):
  1. Profile page shows an email/password sign-in form when user is not authenticated
  2. Mock sign-in validates format, simulates delay, and on success shows profile settings and history
  3. User can sign out from the profile page, returning to the sign-in form
  4. User can edit the essay text in the results view left panel and resubmit for re-grading without navigating away
  5. During re-grading, the results panel shows a loading state while the essay remains visible and editable
**Plans**: TBD

Plans:
- [ ] 10-01: TBD
- [ ] 10-02: TBD

## Progress

**Execution Order:**
v1.0: 1 -> 2 -> 3 -> 4 -> 5 -> 6 (complete)
v1.1: 7 -> 8 -> 9 -> 10

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation & API Layer | v1.0 | 2/2 | Complete | 2026-03-08 |
| 2. Essay Input & Rubric Editor | v1.0 | 2/2 | Complete | 2026-03-08 |
| 3. Submission Flow | v1.0 | 1/1 | Complete | 2026-03-08 |
| 4. Results Display | v1.0 | 1/1 | Complete | 2026-03-08 |
| 5. History, Landing & Polish | v1.0 | 2/2 | Complete | 2026-03-08 |
| 6. E2E Testing | v1.0 | 2/2 | Complete | 2026-03-08 |
| 7. Data Contracts & Route Restructure | v1.1 | 0/2 | Not started | - |
| 8. Collapsible Hero & Grading Workspace | v1.1 | 0/1 | Not started | - |
| 9. Side-by-Side Results & Highlighting | v1.1 | 0/3 | Not started | - |
| 10. Mock Auth & Editable Essay | v1.1 | 0/2 | Not started | - |
