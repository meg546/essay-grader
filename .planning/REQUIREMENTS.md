# Requirements: AI Essay Grader

**Defined:** 2026-03-09
**Core Value:** Users can submit an essay with a rubric and immediately see clear, rubric-aligned scores with structured feedback and highlighted essay passages

## v2.0 Requirements

Requirements for backend implementation. Each maps to roadmap phases.

### Infrastructure

- [x] **INFRA-01**: FastAPI project scaffold with async config, environment variables, and Uvicorn server
- [x] **INFRA-02**: Docker Compose orchestrating FastAPI + PostgreSQL with health checks
- [x] **INFRA-03**: CORS middleware configured for Vite dev server origin
- [x] **INFRA-04**: Pydantic response models matching frontend TypeScript types with camelCase alias generation
- [x] **INFRA-05**: Alembic migration setup with initial schema migration

### Authentication

- [x] **AUTH-01**: User can register with email and password (POST /api/auth/register)
- [x] **AUTH-02**: User can login and receive JWT access token (POST /api/auth/login)
- [x] **AUTH-03**: All user-scoped endpoints require valid JWT via FastAPI dependency
- [x] **AUTH-04**: User can validate token and retrieve profile (GET /api/auth/me)

### Grading

- [x] **GRADE-01**: User can submit essay + rubric and receive full GradingResult JSON (POST /api/grade)
- [x] **GRADE-02**: Backend generates character-offset highlight ranges via two-pass approach (LLM quotes text, Python computes offsets)
- [x] **GRADE-03**: Grading adjusts scoring strictness based on grade level parameter
- [x] **GRADE-04**: Model inference endpoint is configurable via environment variable (local/LAN/cloud)

### Persistence

- [x] **PERSIST-01**: Grading results are stored in PostgreSQL on completion (normalized schema)
- [x] **PERSIST-02**: User can view list of past submissions (GET /api/history)
- [x] **PERSIST-03**: User can load full grading result for a past submission (GET /api/history/:id)

### PDF Processing

- [x] **PDF-01**: Backend extracts rubric text from uploaded PDF server-side using pypdf
- [x] **PDF-02**: Grading endpoint accepts both PDF file upload (multipart) and pre-extracted text (JSON)

### Frontend Integration

- [x] **FRONT-01**: Mock API function bodies replaced with real Axios calls to backend
- [x] **FRONT-02**: Axios interceptor adds Authorization Bearer header and handles 401 auto-signout
- [x] **FRONT-03**: Frontend handles error responses gracefully (401, 422 validation, 500 server errors)
- [x] **FRONT-04**: localStorage state migrated from mock auth era (clear/version persist key)

## v2.1 Requirements

Requirements for Onboarding & Layout Redesign milestone.

### Landing Page

- [x] **LAND-01**: User sees a dedicated landing page with site info and feature highlights
- [x] **LAND-02**: Landing page content includes Sign In and Register buttons (not in the nav banner)
- [x] **LAND-03**: Landing page is separate from the grading page (grading requires auth)

### Onboarding

- [x] **ONBD-01**: User goes through a multi-step slider wizard when registering
- [x] **ONBD-02**: Wizard asks writing purpose (work / school / other) — skippable
- [x] **ONBD-03**: Wizard asks grade level — required, cannot be skipped
- [x] **ONBD-04**: User is redirected to the grading page after completing the wizard

### Authentication

- [x] **AUTH2-01**: User can sign in via the landing page Sign In button
- [x] **AUTH2-02**: User can register via the landing page Register button (enters wizard)

### Profile

- [x] **PROF-01**: User can change grade level from the profile page
- [x] **PROF-02**: User can change writing purpose from the profile page

### History

- [x] **HIST-01**: User can delete individual grading submissions from their history

## v2.2 Requirements

Requirements for Live Essay Feedback milestone.

### Editor

- [ ] **EDIT-01**: User can type essays in a Tiptap-based plain text editor
- [ ] **EDIT-02**: User can drag-and-drop or upload .txt/.pdf files into the editor
- [ ] **EDIT-03**: User can adjust text size (small/normal/large) in the editor

### Spelling & Grammar

- [ ] **GRAM-01**: User sees inline underlines for spelling, grammar, and style issues as they type
- [ ] **GRAM-02**: User can click an underlined issue to see suggestions and apply a fix or ignore it

### Toolbar & Productivity

- [ ] **TOOL-01**: User can toggle live feedback on/off via the toolbar
- [ ] **TOOL-02**: User can set a writing timer with preset durations from the toolbar
- [ ] **TOOL-03**: User sees a badge showing the count of open issues on the feedback toggle

## Future Requirements

### Structural Heuristics (deferred from v2.2)

- **HEUR-01**: User sees a thesis hint only after the first paragraph is substantive
- **HEUR-02**: User sees evidence hints only for body paragraphs once the essay has 3+ paragraphs
- **HEUR-03**: User sees a conclusion hint only when the essay appears structurally complete (4+ paragraphs)

### LLM-Powered Feedback

- **LLM-01**: User receives rubric-aware feedback in the editor as they write

### Streaming

- **STREAM-01**: Streaming SSE for progressive result rendering during inference
- **STREAM-02**: Frontend progressively renders scores and feedback sections as they arrive

### Auth Enhancements

- **AUTHX-01**: Refresh token rotation with short-lived access tokens (15min) and longer refresh tokens (7d)

### Advanced Grading

- **ADVGRADE-01**: Dynamic rubric-aligned category generation (LLM reads rubric and creates domain-specific categories)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Fine-tuning pipeline | Separate research project; base model with prompt engineering for v2.0 |
| OAuth / social login | Email+password with JWT sufficient for academic project |
| GPU inference inside Docker | Fragile GPU passthrough; inference runs outside Docker |
| Model evaluation framework | No labeled datasets; manual spot-checking sufficient |
| Rate limiting | Single-user demo; can add slowapi later |
| Plagiarism / AI detection | Different product domain entirely |
| Multi-language support | English only per original scope |
| PDF export of results | Placeholder only; not core value |
| WebSocket real-time updates | SSE is simpler if streaming is added later |
| Caching layer (Redis) | Adds infrastructure complexity for unlikely re-grading scenario |
| Rich text formatting | Editor is plain text only — grading evaluates plain text |
| Auto-correct | Academically problematic — students must explicitly accept fixes |
| Custom dictionary / ignore lists | Adds complexity without core value |
| Structural heuristics | Deferred — contextual triggering needs more design work |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 11 | Complete |
| INFRA-02 | Phase 11 | Complete |
| INFRA-03 | Phase 11 | Complete |
| INFRA-04 | Phase 11 | Complete |
| INFRA-05 | Phase 11 | Complete |
| AUTH-01 | Phase 12 | Complete |
| AUTH-02 | Phase 12 | Complete |
| AUTH-03 | Phase 12 | Complete |
| AUTH-04 | Phase 12 | Complete |
| GRADE-01 | Phase 13 | Complete |
| GRADE-02 | Phase 13 | Complete |
| GRADE-03 | Phase 13 | Complete |
| GRADE-04 | Phase 13 | Complete |
| PERSIST-01 | Phase 14 | Complete |
| PERSIST-02 | Phase 14 | Complete |
| PERSIST-03 | Phase 14 | Complete |
| PDF-01 | Phase 13 | Complete |
| PDF-02 | Phase 13 | Complete |
| FRONT-01 | Phase 15 | Complete |
| FRONT-02 | Phase 15 | Complete |
| FRONT-03 | Phase 15 | Complete |
| FRONT-04 | Phase 15 | Complete |
| LAND-01 | Phase 16 | Complete |
| LAND-02 | Phase 16 | Complete |
| LAND-03 | Phase 16 | Complete |
| AUTH2-01 | Phase 16 | Complete |
| AUTH2-02 | Phase 16 | Complete |
| ONBD-01 | Phase 17 | Complete |
| ONBD-02 | Phase 17 | Complete |
| ONBD-03 | Phase 17 | Complete |
| ONBD-04 | Phase 17 | Complete |
| PROF-01 | Phase 18 | Complete |
| PROF-02 | Phase 18 | Complete |
| HIST-01 | Phase 18 | Complete |
| EDIT-01 | Phase 19 | Pending |
| EDIT-03 | Phase 19 | Pending |
| GRAM-01 | Phase 20 | Pending |
| GRAM-02 | Phase 21 | Pending |
| TOOL-01 | Phase 22 | Pending |
| TOOL-03 | Phase 22 | Pending |
| TOOL-02 | Phase 23 | Pending |
| EDIT-02 | Phase 23 | Pending |

**Coverage:**
- v2.0 requirements: 22 total (all complete)
- v2.1 requirements: 12 total (all complete)
- v2.2 requirements: 8 total
- Mapped to phases: 8/8 ✓
- Unmapped: 0

---
*Requirements defined: 2026-03-09*
*Last updated: 2026-03-12 after v2.2 roadmap created (Phases 19-23)*
