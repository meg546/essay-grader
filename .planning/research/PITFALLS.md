# Pitfalls Research

**Domain:** Adding FastAPI + LLM backend with auth, database, and Docker to existing React essay grading frontend
**Researched:** 2026-03-09
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Event Loop Starvation from Blocking LLM Inference

**What goes wrong:**
Llama 3.2 3B inference is a CPU/GPU-bound operation that takes seconds to tens of seconds. If the grading endpoint is declared `async def` and calls the inference library directly (e.g., `llama_cpp.create_completion()`), the single-threaded asyncio event loop freezes. No other requests -- health checks, auth, history queries -- can be served until inference completes. Under any concurrent load, the server becomes completely unresponsive and Uvicorn workers time out.

**Why it happens:**
Developers see FastAPI tutorials using `async def` everywhere and assume all handlers should be async. They call the blocking inference function inside an async handler without offloading it. Python's GIL means even threading has limits for CPU-bound work, compounding the problem.

**How to avoid:**
- Since the project already plans configurable endpoints (local/LAN/cloud GPU), design the inference layer as an HTTP client call from the start. Use `httpx.AsyncClient` to call Ollama, vLLM, or a remote endpoint -- this is naturally non-blocking
- If calling a local Python inference library directly, use `await run_in_threadpool(run_inference, prompt)` from Starlette
- Simpler alternative: declare the grading handler as plain `def` (not `async def`) -- FastAPI auto-runs sync handlers in a threadpool
- For production: use a dedicated inference server (Ollama or vLLM) as a separate service, called over HTTP

**Warning signs:**
- Other API endpoints slow down when grading is in progress
- Uvicorn logs: "Worker timed out" or SIGTERM errors
- Health check endpoint fails during inference

**Phase to address:**
Phase 1 (Backend Foundation) -- the inference abstraction must be non-blocking from day one. This is architectural and painful to retrofit.

---

### Pitfall 2: Mock-to-Real API Contract Mismatch (snake_case vs camelCase)

**What goes wrong:**
The existing React frontend has typed interfaces (`GradingResult`, `CategoryScore`, `HighlightRange` in `src/api/types.ts`) using camelCase field names: `overallScore`, `essayText`, `gradedAt`, `maxScore`, `categoryId`. Python/FastAPI with Pydantic defaults to snake_case: `overall_score`, `essay_text`, `graded_at`. The frontend receives responses with wrong field names and every field reads as `undefined`. Scores show NaN, highlights vanish, history is empty.

**Why it happens:**
Python convention is snake_case, JavaScript convention is camelCase. FastAPI's `jsonable_encoder` and Pydantic's `.model_dump()` both output snake_case by default. Developers build the entire backend with Python conventions, then discover the contract mismatch only when connecting the frontend. Additionally, mock data was always "happy path" -- every field populated, no nulls -- but real API responses include edge cases: empty categories, zero scores, missing highlights on short essays.

**How to avoid:**
- Treat the existing `src/api/types.ts` as the source of truth. Print it out. Pin it to the wall
- Configure Pydantic models with camelCase aliases:
  ```python
  from pydantic import ConfigDict
  from pydantic.alias_generators import to_camel

  class GradingResult(BaseModel):
      model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
      overall_score: int  # serializes as "overallScore"
  ```
- Write a contract test early: serialize a Pydantic `GradingResult` to JSON and assert all field names match the TypeScript interface
- Handle nullable fields in frontend: add null checks for `highlights`, default empty arrays, fallback for missing `summary`

**Warning signs:**
- TypeScript errors after swapping mock API for real endpoints
- Components rendering `undefined` or `NaN` where values should appear
- JSON responses in network tab show snake_case keys

**Phase to address:**
Phase 1 (Backend Foundation) -- define Pydantic response models matching TypeScript interfaces before writing any endpoint logic. Verify with integration test in Phase 4 (Frontend Integration).

---

### Pitfall 3: CORS Misconfiguration Blocking All Frontend Requests

**What goes wrong:**
The React frontend at `http://localhost:5173` (Vite dev server) sends requests to `http://localhost:8000/api`. Without CORS middleware, browsers block every cross-origin request. Developers fix with `allow_origins=["*"]` but then JWT authentication breaks because `allow_credentials=True` is incompatible with wildcard origins. Or they forget to include `Authorization` in allowed headers, so authenticated requests fail while unauthenticated ones work. Preflight OPTIONS requests fail silently, making POST/PUT requests with JSON bodies get rejected with no obvious error.

**Why it happens:**
CORS is enforced by the browser, not the server. Everything works in Postman and curl. The server-side logs show successful processing. But the browser silently blocks the response. The interaction between credentials mode, specific origins, allowed headers, and preflight is non-obvious.

**How to avoid:**
Configure CORS explicitly from the first line of `main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # exact Vite dev URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],  # includes Authorization for JWT
)
```
Key rules: (1) list exact origins with protocol and port, never wildcard with credentials, (2) add middleware before all routes, (3) use environment variable for origins so Docker/production can override, (4) `localhost` and `127.0.0.1` are different origins -- be consistent.

**Warning signs:**
- Browser console shows "blocked by CORS policy" errors
- Requests work in Postman but fail from the React app
- POST requests fail but GET works (preflight issue)
- Auth requests fail after adding JWT (missing Authorization header)

**Phase to address:**
Phase 1 (Backend Foundation) -- CORS is literally the first thing to configure. Test with the Vite dev server before writing any business logic.

---

### Pitfall 4: Alembic Migration Chaos in Docker

**What goes wrong:**
Developers create database tables with `Base.metadata.create_all()` during initial development, then try to add Alembic later. Alembic autogenerate sees existing tables and either generates a migration that fails ("table already exists") or generates an empty migration (thinks everything is in sync). In Docker, migrations run before PostgreSQL is ready, causing "Connection refused" errors. Or `env.py` does not import all model modules, so autogenerate silently misses tables.

**Why it happens:**
`create_all()` is convenient for getting started but creates schema outside Alembic's tracking. Docker Compose `depends_on` only waits for the container to start, not for PostgreSQL to accept connections (port 5432 may not be listening yet). The `env.py` model import requirement is poorly documented and easy to miss.

**How to avoid:**
- Never use `create_all()` in application code. Use Alembic from the very first migration, even for the initial schema
- In `env.py`, import all model modules explicitly: `from app.models import user, submission, result` -- or use a central `app.models.__init__` that imports all models
- Use `alembic init -t async` if using async SQLAlchemy engine with asyncpg
- Add a database readiness check in Docker entrypoint before running migrations:
  ```bash
  # entrypoint.sh
  while ! pg_isready -h db -p 5432; do sleep 1; done
  alembic upgrade head
  uvicorn app.main:app --host 0.0.0.0 --port 8000
  ```
- Run migrations as an entrypoint step, NOT inside FastAPI's lifespan handler (async context conflicts with Alembic's sync execution)

**Warning signs:**
- `alembic revision --autogenerate` produces empty migration files
- "Table already exists" or "relation does not exist" errors
- Migrations work locally but fail in Docker
- Some tables exist but others are missing

**Phase to address:**
Phase 2 (Database) -- establish Alembic from the first model definition. Docker migration execution in Phase 3 (Docker Compose).

---

### Pitfall 5: LLM Response Format Instability

**What goes wrong:**
The grading endpoint sends a prompt expecting structured JSON output from Llama 3.2 3B with specific fields: `categories` array, numeric `scores`, `highlights` with character offsets, `strengths` and `improvements` arrays. The 3B model intermittently returns malformed JSON (unclosed braces, trailing commas), omits required fields, hallucinates extra fields, produces scores outside valid ranges (negative numbers, exceeding maxScore), or generates highlight character offsets that are out of bounds for the essay text.

**Why it happens:**
LLMs are probabilistic. A 3B parameter model is particularly prone to format instability compared to larger models. Character-level offset generation is fundamentally unreliable -- the model has no reliable concept of character positions. Even with structured output prompting, some percentage of responses will be malformed.

**How to avoid:**
- Wrap all LLM output parsing in try/except with a structured degraded fallback (return scores without highlights rather than 500 error)
- Use Pydantic to validate LLM JSON output: parse into model, catch `ValidationError`, retry once with a simpler prompt, or return degraded response
- For highlights: have the model return quoted text snippets, then use Python string matching (`str.find()`) to compute actual character offsets. Never trust the LLM to produce correct numerical offsets directly
- Clamp scores to valid ranges: `score = max(0, min(score, max_score))`
- Set maximum retry count (2) before returning degraded result
- Log all LLM parsing failures with the raw output for prompt iteration

**Warning signs:**
- Intermittent 500 errors on the grading endpoint
- Highlights appearing at wrong positions or causing IndexError
- Scores of -1, 150/100, or NaN reaching the frontend
- Grading working "most of the time" but randomly failing

**Phase to address:**
Phase 1 (Backend Foundation) -- build the response parsing and validation layer with fallback from the start. This is not optional polish.

---

### Pitfall 6: JWT Token Handling Breaks the Existing Frontend Auth Flow

**What goes wrong:**
The existing frontend has mock auth in `profile-store.ts` that persists `isSignedIn`, `email`, and `gradeLevel` to localStorage. Developers add real JWT auth but: (1) stale `isSignedIn: true` in localStorage from the mock era causes the frontend to think the user is logged in when they have no valid token, (2) tokens stored in localStorage are XSS-vulnerable, (3) no token refresh mechanism means users get logged out mid-essay and lose their work, (4) Axios requests do not include the Authorization header.

**Why it happens:**
The mock auth stores a boolean `isSignedIn` with no token concept. The migration from mock to real auth requires changing how auth state is represented (boolean to token), how it is stored (localStorage to memory or httpOnly cookies), and how it is transmitted (no header to Bearer token). Developers update the backend but leave the frontend store logic unchanged.

**How to avoid:**
- Clear existing localStorage keys (`essay-grader-profile`) during migration, or version the store key
- Store JWT in Zustand state (in-memory, not persisted). On page refresh, attempt a token refresh or redirect to login
- Add an Axios request interceptor that attaches `Authorization: Bearer <token>` to every request
- Add an Axios response interceptor that catches 401 responses, attempts token refresh, and retries the original request
- Keep the existing pattern: grading works without auth, auth only required for history persistence and profile settings
- Use short-lived access tokens (15-30 min) with a `/refresh` endpoint

**Warning signs:**
- Users appear logged in but API calls return 401
- Token visible in browser DevTools > Application > localStorage
- No 401 handling in Axios -- user sees generic "network error" on token expiry
- Refresh loses auth state entirely

**Phase to address:**
Phase 2 (Authentication) for backend JWT implementation. Phase 4 (Frontend Integration) for Axios interceptors and store migration.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `Base.metadata.create_all()` instead of Alembic | DB works in 2 minutes | Cannot evolve schema, no rollback, migration nightmare | Never -- Alembic adds 30 min setup to save days of pain |
| JWT in localStorage | Simple, persists across tabs/refreshes | XSS vulnerability | Academic project with no real user data -- document the risk |
| Sync inference in async handler | Works for single user testing | Server freezes under any concurrency | Never -- use threadpool or HTTP client from day one |
| `allow_origins=["*"]` CORS | "It just works" | Breaks with credentials, insecure | Only during first 10 minutes of debugging, replace immediately |
| Single Dockerfile for backend + model | Simpler container management | Cannot scale inference independently, huge image size | Acceptable for academic project if model is called via HTTP |
| Skipping Pydantic response models | Faster to return raw dicts | No validation, contract drift, serialization bugs | Never -- Pydantic models ARE the API contract |
| Hardcoded inference timeout | Avoid timeout configuration | Different models/hardware need different timeouts | Only acceptable if using env variable for the timeout value |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| React Axios + FastAPI | Not adding Authorization header | Create Axios instance with request interceptor: `config.headers.Authorization = \`Bearer ${token}\`` |
| Vite dev + FastAPI | Assuming `localhost` and `127.0.0.1` are same origin | They are different for CORS. Use consistent hostname. Vite defaults to `localhost` |
| Zustand persist + Real Auth | Persisted `isSignedIn: true` from mock era causes phantom auth | On app load, validate token with `/api/auth/me` endpoint; clear state if invalid |
| FastAPI + PostgreSQL in Docker | Using `localhost` as DB host in app config | Docker services use service names: `DATABASE_URL=postgresql+asyncpg://user:pass@db:5432/essays` |
| Alembic in Docker | Running migrations inside FastAPI lifespan handler | Run `alembic upgrade head` in entrypoint.sh before `uvicorn`, or as `docker compose run backend alembic upgrade head` |
| Frontend PDF upload | Sending PDF as base64 in JSON body | Use `multipart/form-data` with FastAPI `UploadFile`. Set correct Content-Type in Axios |
| Frontend history | Fetching full `GradingResult` for history list | History list endpoint returns lightweight `HistoryItem`; fetch full result only on click |
| Docker Compose networking | Frontend container calling `localhost:8000` | In Docker network, use service name `backend:8000`. For dev, use Vite proxy or env-based API URL |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading LLM model per request | 30-60 second cold start per grading | Load model once at startup via FastAPI lifespan, or use persistent inference server (Ollama) | Every request after idle |
| No DB connection pooling | "Too many connections" errors | SQLAlchemy async engine: `pool_size=5, max_overflow=10` | 10+ concurrent users |
| Unbounded essay in LLM context | OOM, inference takes minutes | Enforce essay length limit (e.g., 10,000 chars). Llama 3.2 3B has 128K context but inference time scales quadratically | Essays > 5000 words |
| Full essay text in history list response | Slow history loading, excessive bandwidth | History endpoint returns `HistoryItem` with excerpt only. Full `GradingResult` fetched via `/submissions/{id}` | 50+ submissions |
| No response streaming | User stares at spinner for 30+ seconds | Use SSE (Server-Sent Events) to stream partial results | Always -- UX concern |
| Synchronous PDF parsing in request handler | Blocks event loop for large PDFs | Use `run_in_threadpool` for PDF extraction, or process async | PDFs > 5MB |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| JWT secret hardcoded in source code | Token forgery if repo is public | Use env variable `JWT_SECRET_KEY`. Generate: `openssl rand -hex 32`. Add to `.gitignore` via `.env` |
| No password hashing (or using MD5/SHA256) | Password leak exposes plaintext credentials | Use `passlib[bcrypt]` or `pwdlib` with Argon2. Never store reversible hashes |
| No rate limiting on grading endpoint | Inference is expensive; abuse exhausts GPU resources | Use `slowapi` middleware: 10 grades/hour per user |
| Exposing stack traces in error responses | Information leakage about internals | FastAPI exception handler returns generic error in production. Log details server-side |
| No input validation on essay text length | Prompt injection, resource exhaustion via huge essays | Validate: 50 chars min, 50,000 chars max. Reject before hitting LLM |
| Database URL with credentials in docker-compose.yml | Credentials in version control | Use `.env` file referenced by `env_file:` in docker-compose.yml. Keep `.env` in `.gitignore` |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No progress feedback during inference (30+ sec) | User thinks app broke, refreshes, loses context | Show staged progress: "Analyzing essay...", "Evaluating criteria...", "Generating feedback..." Even approximate stages improve perceived performance |
| Hard logout on token expiry | User loses essay text mid-writing | Essay text is already in Zustand (persisted to localStorage). On re-auth, state survives. But add Axios 401 interceptor to auto-refresh |
| Requiring auth before any grading | Friction kills first-time usage | Keep current pattern: grading works without auth. Auth only for saving history and profile settings |
| Different error formats per endpoint | Frontend needs endpoint-specific error handling | Standardize: `{"detail": "Human message", "code": "ERROR_CODE"}` everywhere |
| PDF upload fails silently on server | User thinks rubric was received but grading ignores it | Return rubric text preview in grading response. Frontend already shows preview on upload -- backend should confirm what it parsed |
| Grading fails with no actionable error | User has no idea what went wrong | Differentiate errors: "Essay too short" vs "Rubric could not be parsed" vs "Grading service unavailable" -- give specific user-facing messages |

## "Looks Done But Isn't" Checklist

- [ ] **CORS:** Tested with actual browser from Vite dev server, not just curl/Postman. Includes preflight for POST with JSON body
- [ ] **Auth flow:** Token refresh works -- set token expiry to 1 minute, use the app for 2 minutes, verify auto-refresh
- [ ] **API contract:** Every field in `src/api/types.ts` has a matching camelCase field in the API response. No extra fields, no missing fields
- [ ] **Alembic:** `alembic upgrade head` works on completely empty database. Tested by dropping all tables and re-running
- [ ] **Docker startup:** `docker compose down -v && docker compose up` creates schema, runs migrations, starts all services without manual intervention
- [ ] **LLM error handling:** Grading endpoint returns a valid degraded response when LLM output is garbage JSON. Test by temporarily corrupting the prompt
- [ ] **Highlight offsets:** Every `start`/`end` in highlights response is a valid index into the essay text. No off-by-one, no out-of-bounds
- [ ] **History pagination:** Works with 0 items, 1 item, and 100+ items. Empty state handled gracefully
- [ ] **PDF upload:** Tested with: normal PDF, scanned image PDF (should fail gracefully), large PDF (>5MB, size limit), and password-protected PDF (clear error)
- [ ] **localStorage migration:** App works after clearing all localStorage. No stale mock-era data confuses real auth state
- [ ] **Environment:** `.env` in `.gitignore`. `.env.example` with all required variables exists and is documented
- [ ] **Docker networking:** Backend connects to `db` service name, not `localhost`. Frontend API URL is configurable via env variable

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Event loop starvation | LOW | Refactor to `run_in_threadpool` or HTTP client call. No schema changes needed, just handler refactor |
| CORS misconfiguration | LOW | Fix middleware config in `main.py`, restart server. 5-minute fix once diagnosed |
| snake_case/camelCase mismatch | MEDIUM | Add `alias_generator=to_camel` to all Pydantic models. May need frontend null-safety patches for edge cases |
| No Alembic from start | HIGH | Must stamp current schema state, recreate migration history. Risk of schema drift or data loss |
| JWT localStorage + no refresh | MEDIUM | Move token to memory, add refresh endpoint and Axios interceptors. Both backend and frontend changes |
| LLM output not validated | MEDIUM | Add Pydantic parsing layer and fallback responses. Must identify all failure modes through testing |
| Docker migration timing | LOW | Add `pg_isready` wait loop to entrypoint script. Quick fix once diagnosed |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Event loop starvation | Phase 1: Backend Foundation | 5 concurrent grading requests complete without timeout. Other endpoints respond during inference |
| API contract mismatch | Phase 1: Backend Foundation | Serialize Pydantic models to JSON; all field names match TypeScript interfaces exactly |
| CORS blocking | Phase 1: Backend Foundation | React dev server calls all endpoints without browser CORS errors |
| Alembic migration chaos | Phase 2: Database | `docker compose down -v && docker compose up` recreates schema from scratch |
| JWT token handling | Phase 2: Auth + Phase 4: Frontend | Token refresh works. Stale localStorage does not cause phantom auth |
| LLM response instability | Phase 1: Backend Foundation | Grading returns valid degraded response when LLM returns malformed JSON |
| Docker networking | Phase 3: Docker Compose | All services start and communicate. Frontend reaches backend, backend reaches DB and inference |
| Mock-to-real state migration | Phase 4: Frontend Integration | App works correctly after clearing all localStorage |
| No streaming UX | Phase 4: Frontend Integration | User sees progressive status within 5 seconds of submission |

## Sources

- [FastAPI CORS Documentation](https://fastapi.tiangolo.com/tutorial/cors/)
- [FastAPI Async / Await Guide](https://fastapi.tiangolo.com/async/)
- [FastAPI JWT / OAuth2 Tutorial](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/)
- [FastAPI Docker Deployment Guide](https://fastapi.tiangolo.com/deployment/docker/)
- [Running Blocking ML Operations Asynchronously in FastAPI](https://apxml.com/courses/fastapi-ml-deployment/chapter-5-async-operations-performance/running-blocking-ml-operations)
- [Async Gotchas in FastAPI](https://medium.com/@rameshkannanyt0078/async-isnt-always-faster-common-gotchas-in-fastapi-5308480a48db)
- [FastAPI + SQLAlchemy + Alembic + Docker Setup](https://berkkaraal.com/blog/2024/09/19/setup-fastapi-project-with-async-sqlalchemy-2-alembic-postgresql-and-docker/)
- [Alembic Async Engine Context Issues](https://github.com/sqlalchemy/alembic/issues/1606)
- [FastAPI Security Design: JWT, OAuth2, CSRF Pitfalls](https://blog.greeden.me/en/2025/10/14/a-beginners-guide-to-serious-security-design-with-fastapi-authentication-authorization-jwt-oauth2-cookie-sessions-rbac-scopes-csrf-protection-and-real-world-pitfalls/)
- [Streaming LLM Output in FastAPI](https://junkangworld.com/blog/stream-llm-output-in-fastapi-a-5-step-2025-tutorial)
- [Ollama VRAM Requirements for Local LLMs](https://localllm.in/blog/ollama-vram-requirements-for-local-llms)
- [Celery + Redis for Long-Running AI Jobs](https://markaicode.com/redis-celery-long-running-ai-jobs/)
- Direct codebase analysis: `src/api/types.ts` (camelCase TypeScript interfaces), `src/api/grading.ts` (mock API structure), `src/stores/profile-store.ts` (mock auth with localStorage persistence), `src/stores/app-store.ts` (Zustand persist config)

---
*Pitfalls research for: AI Essay Grader v2.0 Backend Implementation*
*Researched: 2026-03-09*
