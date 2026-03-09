# Feature Landscape

**Domain:** FastAPI backend for AI essay grading (v2.0 -- replacing mock frontend API layer with real backend)
**Researched:** 2026-03-09
**Confidence:** MEDIUM-HIGH (official docs for FastAPI, vLLM, PyMuPDF verified; LLM grading patterns from academic research)

## Context

The React frontend (v1.1) is complete with mock data behind typed async API functions. This research covers ONLY the backend features needed to replace mock data with real inference, persistence, and authentication. The frontend API contract (`GradingResult`, `HistoryItem`, `GradeEssayRequest`) is already defined and must be matched exactly.

---

## Table Stakes

Features the backend MUST have for the frontend to function. Without these, the mock-to-real swap cannot happen.

| Feature | Why Expected | Complexity | Depends On |
|---------|--------------|------------|------------|
| **POST /api/grade endpoint returning `GradingResult` JSON** | Frontend `gradeEssay()` expects exact shape: `id`, `essayText`, `essayExcerpt`, `overallScore`, `maxScore`, `summary`, `categories[]` with scores/strengths/improvements/justification/highlights, and `gradedAt`. Any deviation breaks the entire results view. | High | LLM inference, structured output, prompt engineering |
| **GET /api/history returning `HistoryItem[]`** | Profile page lists past submissions; frontend expects array with `id`, `essayExcerpt`, `overallScore`, `maxScore`, `categoryCount`, `gradedAt` | Low | PostgreSQL, JWT auth |
| **GET /api/history/:id returning full `GradingResult`** | Clicking a history entry loads full result with all categories, highlights, and essay text for the side-by-side view | Low | PostgreSQL, JWT auth |
| **POST /api/auth/register (email + password)** | Frontend has sign-in form on ProfilePage; needs real user creation. Currently mock accepts any valid email format + 6+ char password | Low | PostgreSQL, password hashing (bcrypt/argon2) |
| **POST /api/auth/login returning JWT access token** | Frontend needs Bearer token; profile store already has `signIn()` method that will call this endpoint | Low | JWT signing (python-jose) |
| **Token-based route protection** | All /api/grade and /api/history endpoints must be user-scoped; unauthorized requests get 401 | Low | FastAPI `Depends()` with OAuth2PasswordBearer |
| **Server-side rubric PDF text extraction** | Frontend currently extracts rubric text client-side with `unpdf` and sends `rubricText` string in `GradeEssayRequest`. Backend should also accept raw PDF upload as a fallback/primary path | Med | PyMuPDF (pymupdf4llm) |
| **Structured JSON from LLM matching `GradingResult` schema** | Model must return valid JSON with nested categories, highlight ranges, score integers -- not free-form prose requiring regex parsing | High | vLLM constrained decoding or Ollama JSON mode + Pydantic validation |
| **Docker Compose for FastAPI + PostgreSQL** | Project requirement: single `docker compose up` runs the backend stack. Model server runs separately (not in Docker) | Med | Dockerfile, docker-compose.yml, health checks |
| **CORS middleware** | Vite dev server at localhost:5173 must reach FastAPI at localhost:8000 | Low | `CORSMiddleware` in FastAPI |
| **Pydantic response models matching frontend types** | FastAPI response schemas must mirror the TypeScript interfaces in `src/api/types.ts` exactly -- field names, types, nesting. This IS the API contract | Low | Direct translation of existing TypeScript types |
| **Database schema for users, submissions, results** | Users table (id, email, hashed_password). Submissions table (id, user_id, essay_text, rubric_text, grade_level, created_at). Results stored as JSON blob or normalized category/highlight tables | Med | SQLAlchemy models, Alembic migrations |

## Differentiators

Features that go beyond basic mock replacement and add real value to the grading experience.

| Feature | Value Proposition | Complexity | Depends On |
|---------|-------------------|------------|------------|
| **Rubric-aligned dynamic category generation** | Instead of hardcoded 4 categories (Content & Ideas, Organization, Style & Voice, Language Conventions), the LLM reads the rubric PDF text and generates scoring categories that match the rubric's actual criteria. A biology rubric gets "Scientific Accuracy" and "Data Analysis" categories, not generic writing ones | High | Quality rubric text extraction, sophisticated prompt engineering, schema flexibility |
| **Character-offset highlight ranges from LLM** | LLM identifies specific essay passages and returns `start`/`end` character positions linked to feedback. This powers the side-by-side highlighting. The two-pass approach (LLM quotes text, post-processing computes offsets) is far more reliable than asking the LLM to count characters | High | Two-pass inference or post-processing pipeline |
| **Grade-level calibration** | Frontend sends `gradeLevel` (elementary/middle-school/high-school/college) via `GradeEssayRequest`. LLM adjusts scoring strictness and feedback language accordingly -- an elementary essay scored at college level would get 1/6 on everything | Med | Prompt engineering with grade-level instructions |
| **Configurable model endpoint (local/LAN/cloud)** | Environment variable points to wherever the model runs: `http://localhost:11434` (Ollama local), `http://192.168.1.x:8000` (LAN vLLM), or cloud GPU endpoint. FastAPI backend is a thin proxy | Med | Abstraction layer, OpenAI-compatible client |
| **Alembic database migrations** | Schema versioning so the database evolves without manual SQL or data loss. Standard for any production FastAPI+PostgreSQL setup | Med | Alembic + SQLAlchemy |
| **Streaming inference with SSE** | Stream partial results as the LLM generates them instead of a 10-30s blocking wait. Frontend progressively renders scores and feedback sections | High | vLLM streaming, FastAPI `EventSourceResponse`, frontend SSE client changes |
| **Refresh token rotation** | Short-lived access tokens (15min) with longer refresh tokens (7d). Better security without constant re-login | Med | Separate refresh token table, rotation logic |

## Anti-Features

Features to explicitly NOT build in v2.0.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Fine-tuning pipeline for Llama 3.2 3B** | Requires training data collection, GPU hours for training, evaluation methodology, and experiment tracking. This is a separate research project, not a backend feature | Use base Llama 3.2 3B Instruct with prompt engineering. Design inference layer so a fine-tuned model is a drop-in replacement via config change |
| **OAuth / social login (Google, GitHub)** | OAuth redirect flows, provider registration, callback handling -- massive complexity for zero demo value | Email + password with bcrypt + JWT. The existing frontend auth UI already works this way |
| **GPU inference inside Docker** | Running vLLM/Ollama in Docker requires NVIDIA Container Toolkit, GPU passthrough config, 10+ GB image sizes, and GPU memory management | Model server runs OUTSIDE Docker on bare metal or dedicated GPU host. FastAPI container calls it via HTTP. Docker Compose runs only FastAPI + PostgreSQL |
| **Model evaluation framework** | Automated scoring accuracy metrics (QWK, Cohen's kappa) against human graders requires labeled essay datasets that do not exist for this project | Manual spot-checking of output quality. If scores feel reasonable on 10-20 test essays, that is sufficient for v2.0 |
| **Rate limiting / abuse prevention** | Single-user course project demo. No adversarial users | Can be added as FastAPI middleware later (slowapi) if ever needed |
| **Plagiarism / AI detection** | Different product domain requiring corpus comparison or classifier models. Explicitly out of scope per PROJECT.md | Not even a placeholder -- separate concern entirely |
| **Multi-language support** | Requires multilingual models and i18n infrastructure | English only per PROJECT.md |
| **PDF export of grading results** | Proper PDF generation (WeasyPrint, reportlab) adds a dependency for a rarely-used feature | At most a disabled "Export" button on frontend |
| **WebSocket real-time updates** | No multi-user collaboration. SSE is simpler for uni-directional streaming and does not require WebSocket infrastructure | If streaming is added, use SSE (Server-Sent Events) which works over standard HTTP |
| **Caching layer (Redis)** | Adds infrastructure complexity. Same essay+rubric combo being re-graded is unlikely in normal usage | Database stores results; if same essay is resubmitted, re-grade it (results may vary and that is fine) |

## Feature Dependencies

```
Docker Compose (FastAPI + PostgreSQL)
  -> Alembic migrations (creates tables)
    -> User model + password hashing
      -> POST /api/auth/register
      -> POST /api/auth/login (returns JWT)
        -> FastAPI Depends() auth middleware
          -> All protected endpoints below

PostgreSQL + Auth
  -> Submission persistence (INSERT on grade, SELECT on history)
    -> GET /api/history (user-scoped)
    -> GET /api/history/:id (user-scoped)

LLM serving (Ollama for dev, vLLM for production)
  -> Structured JSON output (constrained decoding)
    -> POST /api/grade
      -> Score generation (per-category scores + feedback text)
      -> Highlight generation (two-pass: LLM quotes text -> post-process computes offsets)
        -> Full GradingResult response

PyMuPDF server-side extraction
  -> Rubric text available for grading prompt
    -> POST /api/grade accepts multipart/form-data (PDF file) OR JSON (pre-extracted text)

Frontend integration (LAST)
  -> Replace gradeEssay() body with Axios POST to /api/grade
  -> Replace getHistory() / getHistoryItem() with Axios GET calls
  -> Replace signIn() with Axios POST to /api/auth/login
  -> Add Axios interceptor for Authorization: Bearer header
  -> Handle 401 -> auto sign-out
```

## MVP Recommendation

**Prioritize (in build order):**

1. **Docker Compose with FastAPI skeleton + PostgreSQL** -- Foundation everything sits on. Includes health checks, CORS middleware, Alembic for schema setup. Validates the infrastructure before writing business logic.

2. **User model + JWT auth (register/login/protect routes)** -- Unblocks all user-scoped endpoints. Follow FastAPI's official OAuth2+JWT pattern. Use `passlib[bcrypt]` for hashing and `python-jose[cryptography]` for JWT. Simple access token with 24h expiry (no refresh token needed for demo).

3. **Submission persistence + history endpoints** -- Straightforward CRUD: store `GradingResult` as JSONB in PostgreSQL on grade completion, query by user_id for history. Validates the database layer works before adding LLM complexity.

4. **LLM inference endpoint with structured output** -- The hard part. Start with Ollama locally for easy dev setup (`ollama pull llama3.2:3b`). Use Ollama's JSON mode (`format: "json"`) with Pydantic validation. Design the inference client interface so vLLM is a config swap later. Use two-pass approach: (a) LLM generates scores + feedback + quoted text spans, (b) Python post-processing finds quoted spans in essay text and computes character offsets.

5. **Server-side PDF extraction** -- PyMuPDF (`pymupdf4llm`) for rubric parsing. Accept both `multipart/form-data` (PDF file upload) and JSON body with `rubricText` string. Frontend currently sends pre-extracted text, so the JSON path is the primary flow; PDF upload is the robust fallback.

6. **Frontend integration** -- Swap mock API function bodies to real Axios calls. Add auth token to Zustand profile store. Wire up Axios interceptor for Bearer header. Handle error responses (401 -> sign out, 422 -> validation error display, 500 -> generic error).

**Defer to v2.1:**

- **Streaming SSE**: Synchronous grading works first. The 10-30s wait is acceptable; streaming is polish.
- **Refresh token rotation**: 24h access token expiry is fine for a demo. No refresh token complexity.
- **Dynamic rubric category extraction**: Start with a fixed prompt that always produces 4 categories matching the existing frontend mock structure. Rubric text is included for context but categories are predefined. Dynamic extraction can come later.
- **Alembic migrations**: For v2.0 initial setup, `Base.metadata.create_all()` is sufficient. Add Alembic when the schema needs to evolve.

## Complexity Deep Dive

### The Hard Problem: Structured LLM Output with Highlight Ranges

The most complex feature is getting Llama 3.2 3B to reliably produce:
1. Valid JSON matching the nested `GradingResult` schema
2. Character-offset highlight ranges (`start`, `end`) that correspond to actual positions in the essay text

**Why this is hard:**
- Llama 3.2 3B (3 billion params) struggles with complex JSON schemas out-of-the-box. HuggingFace forum reports confirm this -- the model often produces malformed JSON or misses required fields without constrained decoding.
- Character offset calculation requires "counting" characters -- LLMs cannot do this reliably. Asking for `{"start": 142, "end": 198}` will produce wrong numbers.
- The target schema is non-trivial: 4 categories, each with arrays of strings and arrays of highlight objects containing integers.

**Recommended two-pass approach:**

Pass 1 -- LLM generates grading content:
```json
{
  "categories": [
    {
      "name": "Content & Ideas",
      "score": 5,
      "maxScore": 6,
      "strengths": ["Strong thesis..."],
      "improvements": ["Needs more evidence..."],
      "justification": "The essay presents...",
      "highlightQuotes": [
        {"text": "technology has fundamentally transformed", "type": "strength", "feedback": "Strong opening..."},
        {"text": "Schools must address infrastructure gaps", "type": "improvement", "feedback": "Needs data..."}
      ]
    }
  ],
  "summary": "Overall assessment..."
}
```

Pass 2 -- Python post-processing:
- For each `highlightQuotes[].text`, find the substring in the original essay using `str.find()` or fuzzy matching
- Compute `start` and `end` integer offsets
- If a quote is not found (LLM hallucinated or paraphrased), drop that highlight silently
- Assemble the final `GradingResult` with computed offsets

**Confidence:** HIGH that this approach works. Quoting text is something LLMs do well. String matching is deterministic. The only failure mode is the LLM paraphrasing instead of quoting exactly, which fuzzy matching mitigates.

### Auth Token Integration with Existing Frontend

The frontend Zustand profile store already has `signIn()`, `signOut()`, `isSignedIn`, and `email`. The integration path:

- `signIn()` calls `POST /api/auth/login`, receives `{ access_token, token_type }`, stores token in Zustand (persisted to localStorage via existing `persist` middleware)
- New Axios interceptor reads token from store, adds `Authorization: Bearer <token>` header to all requests
- 401 responses trigger `signOut()` which clears token and redirects to profile page
- Registration is a new `POST /api/auth/register` call; on success, auto-login

This is straightforward because the frontend already has the complete auth UI and store structure -- only the function bodies change, exactly as designed in v1.1.

### Rubric PDF Handling: Client-Side vs Server-Side

Current flow: Frontend extracts text client-side with `unpdf` library, sends `rubricText` string in `GradeEssayRequest`. This works but has limitations:
- `unpdf` is less robust than server-side extractors for complex PDFs
- Large PDFs slow down the browser

Recommended approach for v2.0:
- **Primary path**: Frontend continues sending `rubricText` string (backward compatible, no upload needed)
- **Enhanced path**: Frontend sends PDF as `multipart/form-data`, backend extracts with PyMuPDF (more robust, handles scanned PDFs with OCR if needed)
- **Backend endpoint accepts both**: Check Content-Type; if `multipart/form-data` with a PDF file, extract server-side; if JSON with `rubricText`, use it directly
- This avoids breaking the existing frontend flow while enabling a better path

## Sources

- [FastAPI Official JWT/OAuth2 Tutorial](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/) -- HIGH confidence, official docs
- [vLLM Structured Outputs Documentation](https://docs.vllm.ai/en/v0.8.2/features/structured_outputs.html) -- HIGH confidence, official docs
- [vLLM Structured Outputs in Practice (Red Hat)](https://developers.redhat.com/articles/2025/06/03/structured-outputs-vllm-guiding-ai-responses) -- MEDIUM confidence
- [Ollama vs vLLM Performance Comparison (Red Hat)](https://developers.redhat.com/articles/2025/08/08/ollama-vs-vllm-deep-dive-performance-benchmarking) -- MEDIUM confidence
- [vLLM vs Ollama vs llama.cpp 2025 Guide (ITECS)](https://itecsonline.com/post/vllm-vs-ollama-vs-llama.cpp-vs-tgi-vs-tensort) -- MEDIUM confidence
- [PyMuPDF Documentation](https://pymupdf.readthedocs.io/en/latest/tutorial.html) -- HIGH confidence, official docs
- [Python PDF Extractors 2025 Comparison](https://onlyoneaman.medium.com/i-tested-7-python-pdf-extractors-so-you-dont-have-to-2025-edition-c88013922257) -- MEDIUM confidence
- [LLM-based Automated Essay Scoring (Nature, 2025)](https://www.nature.com/articles/s41598-025-87862-3) -- HIGH confidence, peer-reviewed
- [Multi-Step Grading Rubrics with LLMs](https://www.thegreenreport.blog/articles/multi-step-grading-rubrics-with-llms-for-answer-evaluation/multi-step-grading-rubrics-with-llms-for-answer-evaluation.html) -- MEDIUM confidence
- [Llama 3.2 3B Structured JSON (HuggingFace Forums)](https://discuss.huggingface.co/t/ask-for-a-structured-json-object-in-the-call-to-meta-llama-llama-3-2-3b-instruct/138998) -- MEDIUM confidence, community reports
- [FastAPI LLM Best Practices (Agents Arcade)](https://agentsarcade.com/blog/building-llm-apps-with-fastapi-best-practices) -- MEDIUM confidence
- [Docker Compose FastAPI + PostgreSQL patterns](https://blog.devops.dev/a-scalable-approach-to-fastapi-projects-with-postgresql-alembic-pytest-and-docker-using-uv-78ebf6f7fb9a) -- MEDIUM confidence
- [LLM JSON Structured Output (Llama API)](https://llama.developer.meta.com/docs/features/structured-output/) -- HIGH confidence, official Meta docs

---
*Feature research for: AI Essay Grader v2.0 Backend Implementation*
*Researched: 2026-03-09*
