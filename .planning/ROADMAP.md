# Roadmap: AI Essay Grader

## Milestones

- ✅ **v1.0 MVP** — Phases 1-6 (shipped 2026-03-08)
- ✅ **v1.1 UX Redesign** — Phases 7-10 (shipped 2026-03-09)
- ✅ **v2.0 Backend Implementation** — Phases 11-15 (shipped 2026-03-10)
- ✅ **v2.1 Onboarding & Layout Redesign** — Phases 16-18 (shipped 2026-03-10)
- 🚧 **v2.2 Live Essay Feedback** — Phases 19-23 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>✅ v1.0 MVP (Phases 1-6) — SHIPPED 2026-03-08</summary>

- [x] **Phase 1: Foundation & API Layer** — Project scaffolding, design system, mock API with typed contracts, routing, and responsive layout shell
- [x] **Phase 2: Essay Input & Rubric Editor** — Complete input experience: essay textarea, file upload with PDF extraction, and fully editable rubric
- [x] **Phase 3: Submission Flow** — Submit essay + rubric for grading with loading state and redirect to results
- [x] **Phase 4: Results Display** — Per-category scores, color-coded bars, structured feedback, and aggregate scoring
- [x] **Phase 5: History, Landing & Polish** — Submission history table, landing page, and dark mode toggle
- [x] **Phase 6: E2E Testing** — Comprehensive Playwright end-to-end tests covering all success criteria from phases 1-5

</details>

<details>
<summary>✅ v1.1 UX Redesign (Phases 7-10) — SHIPPED 2026-03-09</summary>

- [x] **Phase 7: Data Contracts & Route Restructure** — Mock API highlight schema, two-tab navigation, layout width fix (completed 2026-03-08)
- [x] **Phase 8: Collapsible Hero & Grading Workspace** — Combined home/grade page with hero that collapses on input focus (completed 2026-03-09)
- [x] **Phase 9: Side-by-Side Results & Highlighting** — Two-column results layout with always-on color-coded essay highlighting (completed 2026-03-09)
- [x] **Phase 10: Mock Auth & Editable Essay** — Email/password sign-in on profile, editable essay with resubmit from results view (completed 2026-03-09)

</details>

<details>
<summary>✅ v2.0 Backend Implementation (Phases 11-15) — SHIPPED 2026-03-10</summary>

- [x] **Phase 11: Backend Foundation** — FastAPI scaffold, Docker Compose with PostgreSQL, Pydantic response models matching frontend types, Alembic migrations (completed 2026-03-09)
- [x] **Phase 12: Authentication** — User registration, login, JWT tokens, and route protection via FastAPI dependency (completed 2026-03-09)
- [x] **Phase 13: LLM Inference & Grading** — Model inference pipeline, prompt engineering, structured output validation, highlight generation, and rubric PDF parsing (completed 2026-03-09)
- [x] **Phase 14: Persistence & History** — Store grading results in PostgreSQL, expose history list and detail endpoints (completed 2026-03-10)
- [x] **Phase 15: Frontend Integration** — Replace mock API calls with real Axios requests, auth interceptors, error handling, localStorage migration (completed 2026-03-10)

</details>

<details>
<summary>✅ v2.1 Onboarding & Layout Redesign (Phases 16-18) — SHIPPED 2026-03-10</summary>

- [x] **Phase 16: Landing Page & Auth Entry** — Grammarly-style landing page with feature highlights and sign-in/register entry points (completed 2026-03-10)
- [x] **Phase 17: Registration Wizard** — Multi-step onboarding slider with writing purpose and grade level questions (completed 2026-03-10)
- [x] **Phase 18: Profile Settings & History Management** — Update user preferences from profile and delete submissions from history (completed 2026-03-10)

</details>

### 🚧 v2.2 Live Essay Feedback (In Progress)

**Milestone Goal:** Replace the plain textarea essay input with a Tiptap-based editor that gives students real-time spelling, grammar, and structural feedback as they write, before they submit for LLM grading.

- [x] **Phase 19: Tiptap Editor Foundation** — Install Tiptap, replace textarea with plain-text editor, establish one-way Zustand sync, preserve word count and grading submission flow (completed 2026-03-12)
- [ ] **Phase 20: LanguageTool Decorations** — ProseMirror plugin for inline spelling/grammar underlines, position-mapped decorations, 3-second debounce with rate-limit backoff
- [ ] **Phase 21: Suggestion Popover** — Click-to-fix popover on decorated spans, apply/dismiss suggestions, viewport-aware positioning via shadcn/ui Popover
- [ ] **Phase 22: Feedback Toggle & Issue Badge** — Toolbar toggle to enable/disable live feedback with visible issue count badge on the toggle button
- [ ] **Phase 23: Writing Timer & File Upload** — Elapsed session timer in the toolbar replacing the History button, drag-and-drop .txt/.pdf file upload into the editor

## Phase Details

<details>
<summary>v1.0 Phase Details (Phases 1-6)</summary>

### Phase 1: Foundation & API Layer
**Goal**: Project scaffolding with routing, design system, and mock API contracts
**Plans:** 2/2 plans complete

### Phase 2: Essay Input & Rubric Editor
**Goal**: Complete input experience with essay and rubric
**Plans:** 2/2 plans complete

### Phase 3: Submission Flow
**Goal**: Submit essay + rubric with loading state
**Plans:** 2 plans

### Phase 4: Results Display
**Goal**: Scores, feedback, and aggregate display
**Plans:** 2 plans

### Phase 5: History, Landing & Polish
**Goal**: History table, landing page, dark mode
**Plans:** 2/2 plans complete

### Phase 6: E2E Testing
**Goal**: Full Playwright test coverage
**Plans:** 2/2 plans complete

</details>

<details>
<summary>v1.1 Phase Details (Phases 7-10)</summary>

### Phase 7: Data Contracts & Route Restructure
**Goal**: Highlight data schema and two-tab navigation
**Plans:** 2/2 plans complete

### Phase 8: Collapsible Hero & Grading Workspace
**Goal**: Combined home/grade page with collapsible hero
**Plans:** 2 plans

### Phase 9: Side-by-Side Results & Highlighting
**Goal**: Split-pane results with color-coded essay highlighting
**Plans:** 2/2 plans complete

### Phase 10: Mock Auth & Editable Essay
**Goal**: Mock authentication and essay editing in results view
**Plans:** 2/2 plans complete

</details>

<details>
<summary>v2.0 Phase Details (Phases 11-15)</summary>

### Phase 11: Backend Foundation
**Goal**: A running FastAPI server in Docker Compose with PostgreSQL, configured for the frontend to connect to
**Depends on**: Nothing (first phase of v2.0)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05
**Success Criteria** (what must be TRUE):
  1. `docker compose up` starts FastAPI + PostgreSQL and both containers report healthy
  2. FastAPI serves a response at http://localhost:8000/api with CORS headers allowing the Vite dev server origin
  3. Pydantic response models serialize to camelCase JSON matching the existing frontend TypeScript types (GradingResult, HistoryItem)
  4. Alembic can generate and apply migrations against the running PostgreSQL instance
**Plans:** 2/2 plans complete

### Phase 12: Authentication
**Goal**: Users can register, log in, and access protected endpoints with JWT tokens
**Depends on**: Phase 11
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04
**Success Criteria** (what must be TRUE):
  1. User can register with email and password via POST /api/auth/register and receive a JWT
  2. User can log in with valid credentials via POST /api/auth/login and receive a JWT
  3. Requesting GET /api/auth/me with a valid token returns the user's profile
  4. Requesting any protected endpoint without a valid token returns 401 Unauthorized
**Plans:** 2/2 plans complete

### Phase 13: LLM Inference & Grading
**Goal**: Users can submit an essay with a rubric and receive a complete grading result with scores, feedback, and highlighted passages
**Depends on**: Phase 11
**Requirements**: GRADE-01, GRADE-02, GRADE-03, GRADE-04, PDF-01, PDF-02
**Success Criteria** (what must be TRUE):
  1. POST /api/grade with essay text and rubric returns a full GradingResult JSON
  2. Response includes character-offset highlight ranges that correctly map to passages in the submitted essay text
  3. Grading produces noticeably different scoring when the same essay is submitted at different grade levels
  4. Grading endpoint accepts both a PDF file upload and pre-extracted rubric text
  5. Changing the MODEL_ENDPOINT environment variable switches inference to a different host without code changes
**Plans:** 3/3 plans complete

### Phase 14: Persistence & History
**Goal**: Grading results are saved and users can browse and reload past submissions
**Depends on**: Phase 12, Phase 13
**Requirements**: PERSIST-01, PERSIST-02, PERSIST-03
**Success Criteria** (what must be TRUE):
  1. After grading completes, the result is stored in PostgreSQL and survives a container restart
  2. GET /api/history returns a list of the authenticated user's past submissions
  3. GET /api/history/:id returns the full grading result for a past submission
**Plans:** 2/2 plans complete

### Phase 15: Frontend Integration
**Goal**: The React frontend uses the real backend for all operations — no mock data remains
**Depends on**: Phase 12, Phase 13, Phase 14
**Requirements**: FRONT-01, FRONT-02, FRONT-03, FRONT-04
**Success Criteria** (what must be TRUE):
  1. User can register, log in, grade an essay, and view history through the browser UI against the real backend
  2. Authorization header is automatically attached to all API requests after login
  3. An expired or invalid token triggers automatic sign-out and redirect to the login screen
  4. Backend validation errors (422) and server errors (500) display user-friendly messages in the UI
  5. A user with leftover mock-era localStorage data is not stuck in a broken auth state after upgrading
**Plans:** 3/3 plans complete

</details>

<details>
<summary>v2.1 Phase Details (Phases 16-18)</summary>

### Phase 16: Landing Page & Auth Entry
**Goal**: Users arrive at a dedicated landing page that communicates the product value and provides clear paths to sign in or register
**Depends on**: Phase 15
**Requirements**: LAND-01, LAND-02, LAND-03, AUTH2-01, AUTH2-02
**Success Criteria** (what must be TRUE):
  1. Unauthenticated user visiting the root URL sees a landing page with site description and feature highlights — not the grading page
  2. Landing page displays prominent Sign In and Register buttons within the page content (not only in a nav bar)
  3. Clicking Sign In opens the sign-in flow and successful login redirects to the grading page
  4. Clicking Register begins the registration flow (entering the onboarding wizard in Phase 17)
  5. An already-authenticated user visiting the root URL is redirected to the grading page, bypassing the landing page
**Plans:** 2/2 plans complete

### Phase 17: Registration Wizard
**Goal**: New users complete a multi-step onboarding wizard during registration that captures their preferences before entering the app
**Depends on**: Phase 16
**Requirements**: ONBD-01, ONBD-02, ONBD-03, ONBD-04
**Success Criteria** (what must be TRUE):
  1. After entering registration credentials, user sees a multi-step slider wizard (not a single form)
  2. Wizard includes a writing purpose step (work / school / other) that can be skipped
  3. Wizard includes a grade level step that cannot be skipped — user must select before proceeding
  4. After completing (or skipping to) the final wizard step, user is redirected to the grading page with their preferences saved
**Plans:** 2/2 plans complete

### Phase 18: Profile Settings & History Management
**Goal**: Users can update their onboarding preferences at any time from the profile page and manage their submission history
**Depends on**: Phase 17
**Requirements**: PROF-01, PROF-02, HIST-01
**Success Criteria** (what must be TRUE):
  1. User can change their grade level from the profile settings page and the new value persists across sessions
  2. User can change their writing purpose from the profile settings page and the new value persists across sessions
  3. User can delete an individual grading submission from their history list and it no longer appears
**Plans:** 2/2 plans complete

</details>

### Phase 19: Tiptap Editor Foundation
**Goal**: The essay input is a Tiptap-based plain text editor that syncs content to Zustand one-way, preserves existing submission flow, and supports text size adjustment
**Depends on**: Phase 18
**Requirements**: EDIT-01, EDIT-03
**Success Criteria** (what must be TRUE):
  1. User can type an essay in the editor and the text displays correctly with proper cursor, undo, and IME behavior
  2. User can select small, normal, or large text size from the toolbar and the editor font size changes immediately
  3. Word and character count updates live as the user types, matching the behavior of the removed textarea
  4. Submitting the essay for grading produces identical results to the previous textarea — the plain text contract is preserved
**Plans:** 2/2 plans complete
Plans:
- [x] 19-01-PLAN.md — Install Tiptap editor and add text size selector
- [ ] 19-02-PLAN.md — Fix EssayUploadModal editor sync gap (gap closure)

### Phase 20: LanguageTool Decorations
**Goal**: Users see wavy underlines for spelling, grammar, and style issues that appear automatically as they type, powered by the LanguageTool API
**Depends on**: Phase 19
**Requirements**: GRAM-01
**Success Criteria** (what must be TRUE):
  1. Spelling and grammar errors in a typed essay are marked with colored wavy underlines within 3-4 seconds of the user stopping
  2. Underlines correctly highlight the exact word or phrase flagged by LanguageTool — no off-by-one errors in single or multi-paragraph essays
  3. Underlines clear immediately and re-check when the user resumes typing
  4. When LanguageTool returns a 429 rate-limit error, existing underlines remain visible and a new check is retried after a backoff delay
**Plans**: TBD

### Phase 21: Suggestion Popover
**Goal**: Users can act on flagged issues by clicking an underline to see suggestions, apply a fix, or dismiss the issue
**Depends on**: Phase 20
**Requirements**: GRAM-02
**Success Criteria** (what must be TRUE):
  1. Clicking an underlined word or phrase opens a popover showing the issue message and available replacement suggestions
  2. Clicking a suggestion in the popover replaces the flagged text in the editor and closes the popover
  3. User can dismiss an issue from the popover — the underline disappears and the issue does not reappear for that occurrence until the text changes
  4. Popover stays within the visible viewport even when the flagged text is near the top or bottom edge of the editor
**Plans**: TBD

### Phase 22: Feedback Toggle & Issue Badge
**Goal**: Users can disable live grammar feedback when they want to write without distraction, and always see how many issues are open at a glance
**Depends on**: Phase 20
**Requirements**: TOOL-01, TOOL-03
**Success Criteria** (what must be TRUE):
  1. Clicking the feedback toggle button in the toolbar immediately removes all underlines from the editor
  2. Clicking the toggle again immediately triggers a new LanguageTool check and underlines reappear
  3. A badge on the toggle button shows the current count of open issues and updates as issues are resolved or new ones are found
  4. The toggle state is preserved if the user navigates away and returns to the grading page
**Plans**: TBD

### Phase 23: Writing Timer & File Upload
**Goal**: Users have a session timer in the toolbar to track their writing time, and can load essay content by dropping or uploading a file instead of typing
**Depends on**: Phase 19
**Requirements**: TOOL-02, EDIT-02
**Success Criteria** (what must be TRUE):
  1. The toolbar displays an elapsed MM:SS timer that starts on the first keystroke in the editor and pauses when the editor loses focus
  2. User can select preset timer durations (e.g., 15 min, 30 min, 45 min) and the timer counts down, showing time remaining
  3. User can drag and drop a .txt or .pdf file onto the editor and the file's text content is loaded into the editor
  4. User can click an upload button in the editor to open a file picker and load a .txt or .pdf file the same way
**Plans**: TBD

## Progress

**Execution Order:**
v1.0: 1 → 2 → 3 → 4 → 5 → 6 (complete)
v1.1: 7 → 8 → 9 → 10 (complete)
v2.0: 11 → 12 → 13 → 14 → 15 (complete)
v2.1: 16 → 17 → 18 (complete)
v2.2: 19 → 20 → 21 → 22, 23 (22 and 23 can proceed after 20 independently)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation & API Layer | v1.0 | 2/2 | Complete | 2026-03-08 |
| 2. Essay Input & Rubric Editor | v1.0 | 2/2 | Complete | 2026-03-08 |
| 3. Submission Flow | v1.0 | 1/1 | Complete | 2026-03-08 |
| 4. Results Display | v1.0 | 1/1 | Complete | 2026-03-08 |
| 5. History, Landing & Polish | v1.0 | 2/2 | Complete | 2026-03-08 |
| 6. E2E Testing | v1.0 | 2/2 | Complete | 2026-03-08 |
| 7. Data Contracts & Route Restructure | v1.1 | 2/2 | Complete | 2026-03-08 |
| 8. Collapsible Hero & Grading Workspace | v1.1 | 1/1 | Complete | 2026-03-09 |
| 9. Side-by-Side Results & Highlighting | v1.1 | 2/2 | Complete | 2026-03-09 |
| 10. Mock Auth & Editable Essay | v1.1 | 2/2 | Complete | 2026-03-09 |
| 11. Backend Foundation | v2.0 | 2/2 | Complete | 2026-03-09 |
| 12. Authentication | v2.0 | 2/2 | Complete | 2026-03-09 |
| 13. LLM Inference & Grading | v2.0 | 3/3 | Complete | 2026-03-09 |
| 14. Persistence & History | v2.0 | 2/2 | Complete | 2026-03-10 |
| 15. Frontend Integration | v2.0 | 3/3 | Complete | 2026-03-10 |
| 16. Landing Page & Auth Entry | v2.1 | 2/2 | Complete | 2026-03-10 |
| 17. Registration Wizard | v2.1 | 2/2 | Complete | 2026-03-10 |
| 18. Profile Settings & History Management | v2.1 | 2/2 | Complete | 2026-03-10 |
| 19. Tiptap Editor Foundation | 2/2 | Complete   | 2026-03-12 | - |
| 20. LanguageTool Decorations | v2.2 | 0/? | Not started | - |
| 21. Suggestion Popover | v2.2 | 0/? | Not started | - |
| 22. Feedback Toggle & Issue Badge | v2.2 | 0/? | Not started | - |
| 23. Writing Timer & File Upload | v2.2 | 0/? | Not started | - |
