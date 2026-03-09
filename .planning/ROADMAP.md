# Roadmap: AI Essay Grader

## Milestones

- ✅ **v1.0 MVP** — Phases 1-6 (shipped 2026-03-08)
- ✅ **v1.1 UX Redesign** — Phases 7-10 (shipped 2026-03-09)
- 🚧 **v2.0 Backend Implementation** — Phases 11-15 (in progress)

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

### 🚧 v2.0 Backend Implementation (In Progress)

**Milestone Goal:** Build the full Python/FastAPI backend with model serving, database, auth, and Docker -- replacing all mock data with real API integration.

- [x] **Phase 11: Backend Foundation** — FastAPI scaffold, Docker Compose with PostgreSQL, Pydantic response models matching frontend types, Alembic migrations (completed 2026-03-09)
- [x] **Phase 12: Authentication** — User registration, login, JWT tokens, and route protection via FastAPI dependency (completed 2026-03-09)
- [ ] **Phase 13: LLM Inference & Grading** — Model inference pipeline, prompt engineering, structured output validation, highlight generation, and rubric PDF parsing
- [ ] **Phase 14: Persistence & History** — Store grading results in PostgreSQL, expose history list and detail endpoints
- [ ] **Phase 15: Frontend Integration** — Replace mock API calls with real Axios requests, auth interceptors, error handling, localStorage migration

## Phase Details

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

Plans:
- [ ] 11-01-PLAN.md -- FastAPI scaffold, Docker Compose with PostgreSQL, health endpoint with CORS
- [ ] 11-02-PLAN.md -- Pydantic camelCase schemas, Alembic migrations, test suite

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

Plans:
- [ ] 12-01-PLAN.md -- User model, Alembic migration, auth utilities (password hashing, JWT tokens)
- [ ] 12-02-PLAN.md -- Auth routes (register, login, me), get_current_user dependency, integration tests

### Phase 13: LLM Inference & Grading
**Goal**: Users can submit an essay with a rubric and receive a complete grading result with scores, feedback, and highlighted passages
**Depends on**: Phase 11
**Requirements**: GRADE-01, GRADE-02, GRADE-03, GRADE-04, PDF-01, PDF-02
**Success Criteria** (what must be TRUE):
  1. POST /api/grade with essay text and rubric returns a full GradingResult JSON (categories with scores, strengths, improvements, justification, and overall summary)
  2. Response includes character-offset highlight ranges that correctly map to passages in the submitted essay text
  3. Grading produces noticeably different scoring when the same essay is submitted at different grade levels
  4. Grading endpoint accepts both a PDF file upload and pre-extracted rubric text, producing equivalent results
  5. Changing the MODEL_ENDPOINT environment variable switches inference to a different host without code changes
**Plans:** 2/3 plans executed

Plans:
- [ ] 13-01-PLAN.md -- LLM client Protocol, three provider adapters (Ollama, Anthropic, OpenAI), config settings
- [ ] 13-02-PLAN.md -- Prompt templates, highlight offset matching, GradingService orchestration
- [ ] 13-03-PLAN.md -- PDF extraction, POST /api/grade endpoint, integration tests

### Phase 14: Persistence & History
**Goal**: Grading results are saved and users can browse and reload past submissions
**Depends on**: Phase 12, Phase 13
**Requirements**: PERSIST-01, PERSIST-02, PERSIST-03
**Success Criteria** (what must be TRUE):
  1. After grading completes, the result is stored in PostgreSQL and survives a container restart
  2. GET /api/history returns a list of the authenticated user's past submissions (title, date, score)
  3. GET /api/history/:id returns the full grading result for a past submission, identical to the original response
**Plans**: TBD

Plans:
- [ ] 14-01: TBD

### Phase 15: Frontend Integration
**Goal**: The React frontend uses the real backend for all operations -- no mock data remains
**Depends on**: Phase 12, Phase 13, Phase 14
**Requirements**: FRONT-01, FRONT-02, FRONT-03, FRONT-04
**Success Criteria** (what must be TRUE):
  1. User can register, log in, grade an essay, and view history through the browser UI against the real backend
  2. Authorization header is automatically attached to all API requests after login
  3. An expired or invalid token triggers automatic sign-out and redirect to the login screen
  4. Backend validation errors (422) and server errors (500) display user-friendly messages in the UI
  5. A user with leftover mock-era localStorage data is not stuck in a broken auth state after upgrading
**Plans**: TBD

Plans:
- [ ] 15-01: TBD
- [ ] 15-02: TBD

## Progress

**Execution Order:**
v1.0: 1 → 2 → 3 → 4 → 5 → 6 (complete)
v1.1: 7 → 8 → 9 → 10 (complete)
v2.0: 11 → 12 → 13 → 14 → 15

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
| 13. LLM Inference & Grading | 2/3 | In Progress|  | - |
| 14. Persistence & History | v2.0 | 0/? | Not started | - |
| 15. Frontend Integration | v2.0 | 0/? | Not started | - |
