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

- [ ] **ONBD-01**: User goes through a multi-step slider wizard when registering
- [ ] **ONBD-02**: Wizard asks writing purpose (work / school / other) — skippable
- [ ] **ONBD-03**: Wizard asks grade level — required, cannot be skipped
- [ ] **ONBD-04**: User is redirected to the grading page after completing the wizard

### Authentication

- [x] **AUTH2-01**: User can sign in via the landing page Sign In button
- [x] **AUTH2-02**: User can register via the landing page Register button (enters wizard)

### Profile

- [ ] **PROF-01**: User can change grade level from the profile page
- [ ] **PROF-02**: User can change writing purpose from the profile page

### History

- [ ] **HIST-01**: User can delete individual grading submissions from their history

## Future Requirements

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
| ONBD-01 | Phase 17 | Pending |
| ONBD-02 | Phase 17 | Pending |
| ONBD-03 | Phase 17 | Pending |
| ONBD-04 | Phase 17 | Pending |
| PROF-01 | Phase 18 | Pending |
| PROF-02 | Phase 18 | Pending |
| HIST-01 | Phase 18 | Pending |

**Coverage:**
- v2.0 requirements: 22 total (all complete)
- v2.1 requirements: 12 total
- Mapped to phases: 12/12
- Unmapped: 0

---
*Requirements defined: 2026-03-09*
*Last updated: 2026-03-10 after v2.1 roadmap created*
