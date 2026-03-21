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

- [x] **EDIT-01**: User can type essays in a Tiptap-based plain text editor
- [ ] **EDIT-02**: User can drag-and-drop or upload .txt/.pdf files into the editor
- [x] **EDIT-03**: User can adjust text size (small/normal/large) in the editor

### Spelling & Grammar

- [x] **GRAM-01**: User sees inline underlines for spelling, grammar, and style issues as they type
- [x] **GRAM-02**: User can click an underlined issue to see suggestions and apply a fix or ignore it

### Toolbar & Productivity

- [ ] **TOOL-01**: User can toggle live feedback on/off via the toolbar
- [x] **TOOL-02**: User can set a writing timer with preset durations from the toolbar
- [ ] **TOOL-03**: User sees a badge showing the count of open issues on the feedback toggle

## v3.0 Requirements

Requirements for Local Model Fine-Tuning milestone.

### Dataset Generation

- [x] **DATA-01**: Script downloads and parses ASAP 2.0 dataset from Kaggle into a standardized format (essay text, human score, prompt ID, rubric)
- [x] **DATA-02**: Script sends essays + rubric to Claude Sonnet API and collects structured JSON grading output matching the app's GradingResult schema
- [x] **DATA-03**: Human holistic score (1-6) is passed to Sonnet as calibration context so generated scores align with human assessments
- [x] **DATA-04**: Training examples are generated across multiple rubric formats (ASAP holistic rubric, app default 4-category rubric, varied custom rubrics) so the model generalizes to arbitrary rubrics
- [x] **DATA-05**: Every training example is validated — generated quotes must exactly match substrings in the essay text; failed examples are rejected and re-generated

### Fine-Tuning Pipeline

- [x] **TRAIN-01**: QLoRA training script using Unsloth supporting both Qwen 2.5 3B and 7B base models
- [x] **TRAIN-02**: LoRA rank is configurable, with higher rank on attention layers (q/k/v_proj) for better quote fidelity
- [x] **TRAIN-03**: Training data is loaded from the validated dataset in chat-template format (system + user + assistant turns)

### Export & Deployment

- [x] **DEPLOY-01**: Trained model is exported to GGUF format with Q4_K_M quantization via Unsloth
- [x] **DEPLOY-02**: Ollama Modelfile is generated for one-command model import (`ollama create essay-grader -f Modelfile`)
- [x] **DEPLOY-03**: Existing backend works with fine-tuned model by changing MODEL_NAME env var only — no code changes needed

### Highlight Accuracy

- [x] **HIGHLIGHT-01**: compute_highlights() uses fuzzy matching fallback (similarity threshold) when exact quote substring match fails
- [x] **HIGHLIGHT-02**: Fuzzy matching correctly identifies near-exact quotes (minor word omissions, punctuation differences) and produces accurate highlight offsets

### Evaluation

- [x] **EVAL-01**: Holdout test set (~10% of ASAP 2.0 essays) is excluded from training data
- [x] **EVAL-02**: Evaluation script scores test essays with the fine-tuned model and compares against human scores using quadratic weighted kappa (QWK)
- [x] **EVAL-03**: Evaluation reports quote accuracy — percentage of generated quotes that exactly match essay substrings
- [x] **EVAL-04**: Evaluation compares fine-tuned model output against Sonnet baseline on the same test set

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
| OAuth / social login | Email+password with JWT sufficient for academic project |
| GPU inference inside Docker | Fragile GPU passthrough; inference runs outside Docker |
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
| EDIT-01 | Phase 19 | Complete |
| EDIT-03 | Phase 19 | Complete |
| GRAM-01 | Phase 20 | Complete |
| GRAM-02 | Phase 21 | Complete |
| TOOL-01 | Phase 22 | Pending |
| TOOL-03 | Phase 22 | Pending |
| TOOL-02 | Phase 23 | Complete |
| EDIT-02 | Phase 23 | Pending |
| DATA-01 | Phase 24 | Complete |
| DATA-02 | Phase 24 | Complete |
| DATA-03 | Phase 24 | Complete |
| DATA-04 | Phase 24 | Complete |
| DATA-05 | Phase 24 | Complete |
| TRAIN-01 | Phase 25 | Complete |
| TRAIN-02 | Phase 25 | Complete |
| TRAIN-03 | Phase 25 | Complete |
| DEPLOY-01 | Phase 26 | Complete |
| DEPLOY-02 | Phase 26 | Complete |
| DEPLOY-03 | Phase 26 | Complete |
| HIGHLIGHT-01 | Phase 27 | Complete |
| HIGHLIGHT-02 | Phase 27 | Complete |
| EVAL-01 | Phase 28 | Complete |
| EVAL-02 | Phase 28 | Complete |
| EVAL-03 | Phase 28 | Complete |
| EVAL-04 | Phase 28 | Complete |

**Coverage:**
- v2.0 requirements: 22 total (all complete)
- v2.1 requirements: 12 total (all complete)
- v2.2 requirements: 8 total
- Mapped to phases: 8/8 ✓
- v3.0 requirements: 15 total
- Mapped to phases: 15/15 ✓
- Unmapped: 0

---
*Requirements defined: 2026-03-09*
*Last updated: 2026-03-21 after v3.0 roadmap created (Phases 24-28)*
