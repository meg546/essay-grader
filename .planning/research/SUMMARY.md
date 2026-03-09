# Project Research Summary

**Project:** AI Essay Grader v2.0 Backend Implementation
**Domain:** FastAPI backend with LLM-powered essay grading, replacing mock frontend API layer
**Researched:** 2026-03-09
**Confidence:** HIGH

## Executive Summary

This project adds a Python/FastAPI backend to an existing React frontend that currently uses mock data behind typed async API functions. The frontend is complete (React 19, Vite 7, TypeScript, Zustand, Tailwind v4) with well-defined TypeScript interfaces (`GradingResult`, `HistoryItem`, `GradeEssayRequest`) that serve as the API contract. The backend must return JSON matching these interfaces exactly -- field names, types, nesting -- or the frontend breaks silently. This is a contract-first integration, not a greenfield build.

The recommended approach is a FastAPI backend calling Llama 3.2 3B via HTTP (Ollama in development, vLLM in production), with PostgreSQL for persistence and JWT for authentication. The inference service runs outside Docker Compose as a separate process because GPU passthrough in Docker is fragile, the model server may live on a different machine, and decoupled scaling is essential. All LLM communication uses the OpenAI-compatible `/v1/chat/completions` protocol, making endpoint swaps a config change. The hardest technical challenge is getting reliable structured JSON output from a 3B parameter model -- the two-pass approach (LLM generates text with quoted highlights, Python post-processes to compute character offsets) is the proven pattern.

The top risks are: (1) event loop starvation if inference is not handled as an async HTTP call from day one, (2) snake_case/camelCase field name mismatch between Python and the existing TypeScript types destroying the frontend, and (3) LLM response format instability requiring robust validation with degraded fallbacks. All three must be addressed in the first phase -- they are architectural decisions that are painful to retrofit.

## Key Findings

### Recommended Stack

The backend is Python 3.12 + FastAPI with async SQLAlchemy 2.0 + asyncpg for PostgreSQL, PyJWT for auth tokens, pwdlib (not passlib -- unmaintained, breaks on Python 3.13) for password hashing, httpx for async HTTP to the inference server, and pypdf (not PyMuPDF -- AGPL license) for server-side PDF text extraction. Docker Compose orchestrates FastAPI + PostgreSQL only; inference runs independently.

**Core technologies:**
- **FastAPI + Uvicorn**: Async web framework with automatic OpenAPI docs and Pydantic v2 validation
- **PostgreSQL 16 + SQLAlchemy 2.0 async + asyncpg**: Normalized schema (users, submissions, categories, highlights) with Alembic migrations
- **Ollama (dev) / vLLM (prod)**: LLM serving via HTTP, OpenAI-compatible protocol, configurable endpoint URL
- **PyJWT + pwdlib[argon2,bcrypt]**: JWT auth with modern password hashing (replaces unmaintained passlib)
- **httpx**: Async HTTP client for all LLM and external calls (never use synchronous `requests` in FastAPI)
- **pypdf**: MIT-licensed PDF text extraction for rubric documents
- **TanStack Query + Axios** (frontend additions): Server state management and HTTP client with auth interceptors

### Expected Features

**Must have (table stakes):**
- POST /api/grade returning `GradingResult` JSON matching frontend types exactly
- GET /api/history and GET /api/history/:id for submission history
- POST /api/auth/register and POST /api/auth/login with JWT
- Token-based route protection via FastAPI Depends()
- Pydantic response models with camelCase alias generation
- CORS middleware configured for Vite dev server
- Docker Compose for single-command startup
- Server-side rubric PDF text extraction

**Should have (differentiators):**
- Two-pass highlight generation (LLM quotes text, Python computes offsets)
- Grade-level calibration in prompts
- Configurable model endpoint (local/LAN/cloud)
- Alembic database migrations from day one

**Defer (v2.1+):**
- Streaming SSE for progressive result rendering
- Refresh token rotation (24h access token is fine for demo)
- Dynamic rubric-aligned category generation (start with fixed 4 categories)
- Fine-tuning pipeline, OAuth/social login, rate limiting, plagiarism detection

### Architecture Approach

Three-tier separation: React SPA calls FastAPI backend calls external inference service. The backend uses module-by-feature structure (auth/, grading/, inference/, pdf/) with each module owning its models, schemas, and routes. The inference module uses a single OpenAI-compatible HTTP client that works with Ollama, vLLM, and cloud providers without code changes. Database schema is normalized (not JSONB) for queryability and migration support. The grading pipeline flows: auth middleware -> parse request -> extract PDF text (if needed) -> build prompt -> call inference HTTP endpoint -> validate LLM JSON via Pydantic -> compute highlight offsets via string matching -> persist to database -> return camelCase response.

**Major components:**
1. **Auth module** -- registration, login, JWT issue/verify, password hashing, get_current_user dependency
2. **Grading module** -- orchestrates PDF parsing + inference + response mapping + persistence
3. **Inference module** -- OpenAI-compatible HTTP client with prompt engineering, configurable endpoint
4. **PDF parser** -- pypdf wrapper for server-side rubric text extraction
5. **Database layer** -- async SQLAlchemy 2.0 with asyncpg, normalized schema, Alembic migrations

### Critical Pitfalls

1. **Event loop starvation from blocking inference** -- Use httpx async HTTP calls to external inference server from day one. Never call a blocking inference library inside an async handler.
2. **snake_case/camelCase API contract mismatch** -- Configure Pydantic `alias_generator=to_camel` on all response models immediately. Write a contract test that serializes Pydantic models and asserts field names match TypeScript interfaces.
3. **LLM response format instability** -- Wrap all LLM output parsing in try/except with Pydantic validation. Return degraded responses (scores without highlights) rather than 500 errors. Use two-pass quote-then-match for highlights.
4. **CORS misconfiguration** -- Configure explicit origins with credentials support in the first line of main.py. Test with actual browser, not curl.
5. **Alembic migration chaos in Docker** -- Never use `create_all()`. Set up Alembic from the very first model. Use `pg_isready` wait loop in Docker entrypoint.
6. **JWT/localStorage state conflict** -- Clear or version the Zustand persist key when migrating from mock to real auth. Validate token on app load with `/api/auth/me`.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Backend Foundation and Infrastructure
**Rationale:** Everything depends on the project scaffold, config system, database connection, and CORS. The inference abstraction (async HTTP client) must be established here to avoid event loop starvation. Pydantic response models matching TypeScript types must be defined before any endpoint logic.
**Delivers:** Running FastAPI skeleton in Docker Compose with PostgreSQL, CORS configured, Pydantic models matching frontend types, async database engine, Alembic initial setup, config via environment variables.
**Addresses:** Docker Compose setup, CORS middleware, Pydantic response models, database connection, Alembic scaffolding.
**Avoids:** Event loop starvation (async-first design), CORS blocking (configured immediately), API contract mismatch (Pydantic models defined up front), Alembic chaos (migrations from day one).

### Phase 2: Authentication
**Rationale:** Auth is a dependency for all user-scoped endpoints. It is low complexity but blocks grading persistence and history. Build it early so all subsequent endpoints can use the `get_current_user` dependency.
**Delivers:** User model + migration, register/login endpoints, JWT token creation/verification, password hashing with pwdlib, FastAPI auth dependency.
**Addresses:** POST /api/auth/register, POST /api/auth/login, GET /api/auth/me, token-based route protection.
**Avoids:** JWT handling pitfalls by keeping it simple (24h access token, no refresh token for v2.0).

### Phase 3: LLM Inference Pipeline
**Rationale:** This is the core value and the hardest technical challenge. It depends on the infrastructure from Phase 1 but not on auth. The inference client, prompt engineering, structured output validation, and highlight offset computation are all here.
**Delivers:** OpenAI-compatible inference client, system prompts for grading, Pydantic validation of LLM output with retry/fallback, two-pass highlight generation, POST /api/grade endpoint.
**Addresses:** Structured JSON from LLM, character-offset highlights, grade-level calibration, configurable model endpoint.
**Avoids:** LLM response instability (validation + degraded fallback from start), event loop blocking (httpx async client).

### Phase 4: Persistence and History
**Rationale:** With grading working, persist results and expose history endpoints. This is straightforward CRUD on normalized tables. Depends on Phase 2 (auth for user scoping) and Phase 3 (grading results to store).
**Delivers:** Submission/Category/Highlight models + migration, persist grading results on completion, GET /api/submissions (list), GET /api/submissions/:id (detail with full result).
**Addresses:** History list and detail endpoints, submission persistence, lightweight vs full query patterns.
**Avoids:** Eager loading trap (separate lightweight list query from full detail query).

### Phase 5: Frontend Integration
**Rationale:** Backend must be fully working and tested before touching the frontend. This phase swaps mock API function bodies for real Axios calls, adds auth token management, and handles the mock-to-real state migration.
**Delivers:** Axios instance with base URL and auth interceptor, real API calls in grading.ts/auth.ts/history.ts, Zustand store updates for JWT, error handling (401, 422, 500), localStorage migration.
**Addresses:** All frontend integration points.
**Avoids:** localStorage state conflict (clear/version persist key), missing Authorization header (interceptor), phantom auth from mock era (validate token on load).

### Phase Ordering Rationale

- Infrastructure first because every module depends on the project scaffold, database connection, and config system. CORS and Pydantic models must be right before any endpoint work.
- Auth before grading persistence because history endpoints are user-scoped. However, the grading inference pipeline (Phase 3) can be developed in parallel with auth since it does not require user context during development.
- Inference before persistence because you need grading results before you can store them. The inference pipeline is also the highest-risk component and should get attention early.
- Frontend last because the backend must be stable and tested. Frontend changes are minimal (3-5 files) but require a working backend to verify.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (LLM Inference Pipeline):** Prompt engineering for structured output from Llama 3.2 3B is the highest-uncertainty area. The two-pass approach is well-reasoned but needs iterative testing. Fuzzy matching for highlight quotes may need tuning. Research specific Ollama JSON mode behavior and response_format support.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Backend Foundation):** Well-documented FastAPI + Docker Compose + SQLAlchemy async patterns.
- **Phase 2 (Authentication):** FastAPI's official JWT tutorial covers this exactly.
- **Phase 4 (Persistence):** Standard SQLAlchemy CRUD. No novel patterns.
- **Phase 5 (Frontend Integration):** Axios interceptors and Zustand store updates are standard React patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies verified against official docs and PyPI. Version compatibility confirmed. pwdlib/PyJWT recommendations based on ecosystem migration away from passlib/python-jose. |
| Features | MEDIUM-HIGH | Table stakes clear from existing frontend types. LLM structured output reliability with 3B model is the main uncertainty. |
| Architecture | HIGH | Module-by-feature structure, OpenAI-compatible inference client, normalized DB schema are established patterns with multiple production references. |
| Pitfalls | HIGH | Every pitfall has documented occurrences in the FastAPI ecosystem. Prevention strategies are specific and actionable. |

**Overall confidence:** HIGH

### Gaps to Address

- **Llama 3.2 3B JSON output quality:** No direct testing of structured output reliability with this specific model. Plan for 2-3 iterations of prompt engineering in Phase 3.
- **Ollama JSON mode behavior:** Ollama's `response_format: {"type": "json_object"}` support needs verification with Llama 3.2 3B specifically.
- **Fuzzy matching for highlight quotes:** If the LLM paraphrases instead of quoting exactly, `str.find()` fails. May need `difflib.SequenceMatcher` or similar.
- **Essay length limits:** No research on optimal max essay length for Llama 3.2 3B inference time. Need to establish practical limits through testing.
- **pypdf vs PyMuPDF discrepancy:** FEATURES.md references PyMuPDF but STACK.md correctly identifies its AGPL license as a blocker. Use pypdf throughout.

## Sources

### Primary (HIGH confidence)
- FastAPI official documentation -- JWT/OAuth2, CORS, Docker deployment, file uploads, async patterns
- SQLAlchemy 2.0 async documentation -- engine setup, session management, asyncpg integration
- Ollama OpenAI compatibility documentation -- inference protocol
- Meta Llama structured output documentation -- JSON output capabilities
- Nature (2025) -- LLM-based automated essay scoring (peer-reviewed)
- vLLM structured outputs documentation -- constrained decoding capabilities

### Secondary (MEDIUM confidence)
- Community FastAPI + SQLAlchemy + Alembic + Docker setup guides (multiple sources agree)
- vLLM vs Ollama performance benchmarks (Red Hat, SitePoint)
- Python PDF extractor comparisons
- HuggingFace forums on Llama 3.2 3B structured output reliability
- FastAPI best practices guides (zhanymkanov, Agents Arcade)

### Tertiary (needs validation)
- Fuzzy matching effectiveness for LLM-quoted text spans
- Optimal essay length limits for 3B model inference time

---
*Research completed: 2026-03-09*
*Ready for roadmap: yes*
