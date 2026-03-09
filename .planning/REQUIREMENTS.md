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

- [ ] **AUTH-01**: User can register with email and password (POST /api/auth/register)
- [ ] **AUTH-02**: User can login and receive JWT access token (POST /api/auth/login)
- [ ] **AUTH-03**: All user-scoped endpoints require valid JWT via FastAPI dependency
- [ ] **AUTH-04**: User can validate token and retrieve profile (GET /api/auth/me)

### Grading

- [ ] **GRADE-01**: User can submit essay + rubric and receive full GradingResult JSON (POST /api/grade)
- [ ] **GRADE-02**: Backend generates character-offset highlight ranges via two-pass approach (LLM quotes text, Python computes offsets)
- [ ] **GRADE-03**: Grading adjusts scoring strictness based on grade level parameter
- [ ] **GRADE-04**: Model inference endpoint is configurable via environment variable (local/LAN/cloud)

### Persistence

- [ ] **PERSIST-01**: Grading results are stored in PostgreSQL on completion (normalized schema)
- [ ] **PERSIST-02**: User can view list of past submissions (GET /api/history)
- [ ] **PERSIST-03**: User can load full grading result for a past submission (GET /api/history/:id)

### PDF Processing

- [ ] **PDF-01**: Backend extracts rubric text from uploaded PDF server-side using pypdf
- [ ] **PDF-02**: Grading endpoint accepts both PDF file upload (multipart) and pre-extracted text (JSON)

### Frontend Integration

- [ ] **FRONT-01**: Mock API function bodies replaced with real Axios calls to backend
- [ ] **FRONT-02**: Axios interceptor adds Authorization Bearer header and handles 401 auto-signout
- [ ] **FRONT-03**: Frontend handles error responses gracefully (401, 422 validation, 500 server errors)
- [ ] **FRONT-04**: localStorage state migrated from mock auth era (clear/version persist key)

## v2.1 Requirements

Deferred to future release. Tracked but not in current roadmap.

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
| AUTH-01 | Phase 12 | Pending |
| AUTH-02 | Phase 12 | Pending |
| AUTH-03 | Phase 12 | Pending |
| AUTH-04 | Phase 12 | Pending |
| GRADE-01 | Phase 13 | Pending |
| GRADE-02 | Phase 13 | Pending |
| GRADE-03 | Phase 13 | Pending |
| GRADE-04 | Phase 13 | Pending |
| PERSIST-01 | Phase 14 | Pending |
| PERSIST-02 | Phase 14 | Pending |
| PERSIST-03 | Phase 14 | Pending |
| PDF-01 | Phase 13 | Pending |
| PDF-02 | Phase 13 | Pending |
| FRONT-01 | Phase 15 | Pending |
| FRONT-02 | Phase 15 | Pending |
| FRONT-03 | Phase 15 | Pending |
| FRONT-04 | Phase 15 | Pending |

**Coverage:**
- v2.0 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0

---
*Requirements defined: 2026-03-09*
*Last updated: 2026-03-09 after roadmap creation*
