# Architecture Patterns

**Domain:** FastAPI backend integration for AI essay grading app
**Researched:** 2026-03-09
**Confidence:** HIGH for backend structure, MEDIUM for model serving (depends on hardware)

## Existing Frontend Architecture (Context)

```
React + Vite + TypeScript + Zustand + Tailwind
  src/api/types.ts       -- GradeEssayRequest, GradingResult, CategoryScore, HighlightRange
  src/api/grading.ts     -- gradeEssay() returns mock data (1500ms delay)
  src/api/mock-data.ts   -- hardcoded GradingResult with highlights
  src/stores/app-store   -- currentResult, history, essayText, rubricFile, rubricText
  src/stores/profile-store -- email, gradeLevel, isSignedIn (mock auth)
  src/lib/pdf-extract.ts -- client-side PDF text extraction via unpdf/pdfjs
```

**Key integration point:** `src/api/grading.ts` is the ONLY file that needs to change to swap mock data for real API calls. The frontend already expects `http://localhost:8000/api` as the base URL (defined in PROJECT.md constraints). The `GradeEssayRequest` and `GradingResult` types define the API contract.

## Recommended Architecture

### System Overview

```
                     Docker Compose Network
  +------------------------------------------------------------------+
  |                                                                    |
  |  [React App]  --->  [FastAPI Backend]  --->  [Inference Service]  |
  |   (host:5173)       (container:8000)         (configurable URL)   |
  |                          |                                         |
  |                          v                                         |
  |                     [PostgreSQL]                                   |
  |                     (container:5432)                               |
  |                                                                    |
  +------------------------------------------------------------------+
```

Three services in Docker Compose: FastAPI backend, PostgreSQL database. The inference service (Ollama, vLLM, or remote API) runs separately -- either on the host, on a LAN GPU machine, or as a cloud endpoint. The FastAPI backend treats it as a configurable HTTP endpoint.

### Why This Separation

The inference service MUST be external to Docker Compose because:
1. GPU passthrough in Docker is fragile and platform-dependent (especially macOS has no GPU passthrough)
2. The model server may run on a different machine (LAN GPU box)
3. Ollama/vLLM already provide their own HTTP servers -- wrapping them in another container adds no value
4. Swapping between local Ollama, LAN vLLM, and cloud APIs becomes a config change, not an architecture change

## Component Boundaries

### Backend Project Structure

Use module-by-feature structure (not file-type). Each domain owns its models, schemas, and routes:

```
backend/
  app/
    main.py                    -- FastAPI app factory, CORS, lifespan
    config.py                  -- Pydantic BaseSettings (env vars)
    database.py                -- async engine, session factory, get_db dependency

    auth/
      router.py                -- POST /register, POST /login, GET /me
      service.py               -- create_user, authenticate, create_token
      models.py                -- User SQLAlchemy model
      schemas.py               -- UserCreate, UserLogin, TokenResponse
      dependencies.py          -- get_current_user dependency

    grading/
      router.py                -- POST /grade, GET /submissions, GET /submissions/{id}
      service.py               -- orchestrates PDF parsing + inference + response mapping
      models.py                -- Submission, Category, Highlight SQLAlchemy models
      schemas.py               -- mirrors frontend types (GradeRequest, GradingResult)

    inference/
      base.py                  -- InferenceClient protocol/ABC
      ollama_client.py         -- Ollama OpenAI-compat implementation
      openai_client.py         -- OpenAI/vLLM/any OpenAI-compat endpoint
      factory.py               -- creates client from config
      prompts.py               -- system prompts, rubric formatting

    pdf/
      parser.py                -- PyMuPDF text extraction

  migrations/
    alembic/                   -- Alembic async migrations

  Dockerfile
  pyproject.toml               -- dependencies via uv
  docker-compose.yml
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| FastAPI app (`main.py`) | HTTP routing, CORS, middleware, lifespan events | All routers |
| Auth module | User registration, login, JWT issue/verify, password hashing | Database, all protected routes via dependency |
| Grading module | Accepts essay+rubric, orchestrates grading pipeline, stores results | Inference service, PDF parser, Database |
| Inference module | Abstract client for LLM calls, prompt construction | External inference server (Ollama/vLLM/cloud) |
| PDF parser | Server-side rubric text extraction | Grading service (called during submission) |
| Database layer | Async SQLAlchemy 2.0 + asyncpg, session management | PostgreSQL container |
| Alembic migrations | Schema versioning | PostgreSQL container |

## API Contract

The backend MUST return responses matching the existing frontend types exactly. This is the contract:

### Endpoints

```
POST   /api/auth/register        -- { email, password } -> { access_token, token_type }
POST   /api/auth/login            -- { email, password } -> { access_token, token_type }
GET    /api/auth/me               -- (Bearer token) -> { id, email, grade_level }

POST   /api/grade                 -- multipart: essay_text, grade_level, rubric_file? -> GradingResult
GET    /api/submissions           -- (Bearer token) -> HistoryItem[]
GET    /api/submissions/{id}      -- (Bearer token) -> GradingResult
```

### Response Schema (must match frontend types)

```python
# These Pydantic schemas MUST produce JSON matching src/api/types.ts

class HighlightRange(BaseModel):
    start: int
    end: int
    category_id: str          # camelCase alias: categoryId
    type: Literal["strength", "improvement"]
    feedback: str

class CategoryScore(BaseModel):
    id: str
    name: str
    score: int
    max_score: int            # camelCase alias: maxScore
    strengths: list[str]
    improvements: list[str]
    justification: str
    highlights: list[HighlightRange]

class GradingResult(BaseModel):
    id: str
    essay_text: str           # camelCase alias: essayText
    essay_excerpt: str        # camelCase alias: essayExcerpt
    overall_score: int        # camelCase alias: overallScore
    max_score: int            # camelCase alias: maxScore
    summary: str
    categories: list[CategoryScore]
    graded_at: str            # camelCase alias: gradedAt

    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel     # Use pydantic's camelCase alias generator
    )
```

**Critical:** Use Pydantic's `alias_generator = to_camel` with `model_config = ConfigDict(populate_by_name=True)` so Python uses snake_case internally but JSON responses use camelCase matching the frontend TypeScript types. This is a one-time config, not per-field aliasing.

## Data Flow

### Grading Pipeline (the core flow)

```
Client POST /api/grade (multipart form)
  |
  v
[Auth Middleware] -- verify JWT, extract user_id
  |
  v
[Grading Router] -- parse multipart: essay_text, grade_level, rubric_file?
  |
  v
[PDF Parser] -- if rubric_file provided, extract text via PyMuPDF
  |              (server-side, replaces client-side unpdf extraction)
  v
[Grading Service] -- build prompt from essay + rubric_text + grade_level
  |
  v
[Inference Client] -- POST to configured inference URL (Ollama/vLLM/cloud)
  |                    Uses OpenAI-compatible /v1/chat/completions format
  |                    System prompt instructs JSON output matching schema
  v
[Response Parser] -- validate LLM JSON output against expected schema
  |                   Compute highlight character offsets from essay text
  |                   Calculate aggregate scores
  v
[Database] -- persist Submission + Categories + Highlights
  |
  v
[Return GradingResult] -- Pydantic model serialized with camelCase aliases
```

### Authentication Flow

```
Register: POST /api/auth/register
  -> hash password with bcrypt (passlib or pwdlib)
  -> insert User into PostgreSQL
  -> return JWT access token

Login: POST /api/auth/login
  -> verify password hash
  -> return JWT access token (HS256, 24h expiry for dev)

Protected routes: Authorization: Bearer <token>
  -> FastAPI dependency extracts + verifies token
  -> injects user_id into route handler
```

## Inference Service Architecture

### The Problem

The model server needs to work in three scenarios:
1. **Local:** Ollama running on the same machine (localhost:11434)
2. **LAN:** vLLM or Ollama on a GPU machine at e.g. 192.168.1.50:8000
3. **Cloud:** Any OpenAI-compatible API (Together, Groq, etc.)

### The Solution: OpenAI-Compatible Protocol + Config

All three scenarios speak the same protocol: OpenAI's `/v1/chat/completions`. Ollama supports this natively. vLLM supports this natively. Cloud providers support this natively. So the inference client is just an HTTP client with a configurable base URL and optional API key.

```python
# app/config.py
class Settings(BaseSettings):
    # Inference configuration
    inference_base_url: str = "http://host.docker.internal:11434"  # Ollama default
    inference_model: str = "llama3.2:3b"
    inference_api_key: str | None = None  # needed for cloud providers only
    inference_timeout: int = 120  # seconds, LLM inference can be slow

    # Database
    database_url: str = "postgresql+asyncpg://user:pass@db:5432/essaygrader"

    # Auth
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 24

    model_config = SettingsConfigDict(env_file=".env")
```

```python
# app/inference/base.py
from typing import Protocol

class InferenceClient(Protocol):
    async def grade_essay(
        self, essay_text: str, rubric_text: str | None, grade_level: str
    ) -> dict:
        """Returns raw grading result dict from LLM."""
        ...

# app/inference/openai_client.py
import httpx

class OpenAICompatClient:
    """Works with Ollama, vLLM, OpenAI, Together, Groq -- anything OpenAI-compatible."""

    def __init__(self, base_url: str, model: str, api_key: str | None, timeout: int):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.api_key = api_key
        self.timeout = timeout

    async def grade_essay(self, essay_text: str, rubric_text: str | None, grade_level: str) -> dict:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        system_prompt = build_grading_prompt(rubric_text, grade_level)

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/v1/chat/completions",
                headers=headers,
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": essay_text}
                    ],
                    "temperature": 0.3,
                    "response_format": {"type": "json_object"}
                }
            )
            # parse response, extract content, validate JSON structure
```

**One client implementation handles all three scenarios.** No need for separate Ollama vs vLLM vs cloud clients. The OpenAI-compatible protocol is the abstraction layer. Switching from local Ollama to a LAN vLLM server is just changing `INFERENCE_BASE_URL` in `.env`.

### Prompt Engineering for Structured Output

The system prompt must instruct the model to return JSON matching the `GradingResult` schema. Key considerations:

1. Include the JSON schema in the system prompt so the model knows the exact structure
2. Use `response_format: {"type": "json_object"}` where supported (Ollama and vLLM both support this)
3. The LLM returns category names, scores, feedback text, and highlight phrases (not character offsets)
4. The backend post-processes to compute character offsets by finding phrase positions in the essay text

```python
# Post-processing: convert LLM phrase references to character offsets
def compute_highlight_offsets(essay_text: str, phrase: str) -> tuple[int, int] | None:
    """Find phrase in essay, return (start, end) character offsets."""
    idx = essay_text.find(phrase)
    if idx == -1:
        return None  # phrase not found, skip this highlight
    return (idx, idx + len(phrase))
```

This mirrors exactly what the existing mock data does (the `hl()` helper in `mock-data.ts` uses `indexOf`).

## Database Schema

### PostgreSQL Models

```python
# app/auth/models.py
class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    grade_level: Mapped[str] = mapped_column(String(50), default="high-school")
    created_at: Mapped[datetime] = mapped_column(default=func.now())

    submissions: Mapped[list["Submission"]] = relationship(back_populates="user")

# app/grading/models.py
class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    essay_text: Mapped[str] = mapped_column(Text)
    rubric_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    grade_level: Mapped[str] = mapped_column(String(50))
    overall_score: Mapped[int]
    max_score: Mapped[int]
    summary: Mapped[str] = mapped_column(Text)
    graded_at: Mapped[datetime] = mapped_column(default=func.now())

    user: Mapped["User"] = relationship(back_populates="submissions")
    categories: Mapped[list["Category"]] = relationship(
        back_populates="submission", cascade="all, delete-orphan"
    )

class Category(Base):
    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    submission_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("submissions.id"), index=True)
    name: Mapped[str] = mapped_column(String(100))
    score: Mapped[int]
    max_score: Mapped[int]
    strengths: Mapped[list[str]] = mapped_column(ARRAY(Text))
    improvements: Mapped[list[str]] = mapped_column(ARRAY(Text))
    justification: Mapped[str] = mapped_column(Text)

    submission: Mapped["Submission"] = relationship(back_populates="categories")
    highlights: Mapped[list["Highlight"]] = relationship(
        back_populates="category", cascade="all, delete-orphan"
    )

class Highlight(Base):
    __tablename__ = "highlights"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    category_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("categories.id"), index=True)
    start: Mapped[int]
    end: Mapped[int]
    type: Mapped[str] = mapped_column(String(20))  # "strength" | "improvement"
    feedback: Mapped[str] = mapped_column(Text)

    category: Mapped["Category"] = relationship(back_populates="highlights")
```

### Why Normalized Tables (Not JSONB)

Store categories and highlights as separate tables, not as JSONB columns on Submission. Reasons:
1. Enables querying: "show all submissions where Category X scored below 3"
2. PostgreSQL ARRAY type handles the string lists (strengths, improvements) cleanly
3. Alembic can manage schema evolution on structured tables; JSONB schema changes are invisible to migrations

## Docker Compose Configuration

```yaml
# docker-compose.yml
services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://essaygrader:essaygrader@db:5432/essaygrader
      - INFERENCE_BASE_URL=http://host.docker.internal:11434  # Ollama on host
      - INFERENCE_MODEL=llama3.2:3b
      - JWT_SECRET=dev-secret-change-in-production
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./app:/code/app  # hot reload in dev
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=essaygrader
      - POSTGRES_PASSWORD=essaygrader
      - POSTGRES_DB=essaygrader
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U essaygrader"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

**Key details:**
- `host.docker.internal` lets the container reach Ollama running on the host machine
- Volume mount `./app:/code/app` enables hot reload during development
- PostgreSQL health check ensures the backend waits for DB readiness
- No inference service in Compose -- it runs independently (see Inference Service Architecture above)

### Dockerfile

```dockerfile
FROM python:3.12-slim

WORKDIR /code

# Install uv for fast dependency resolution
RUN pip install uv

# Copy dependency files first (layer caching)
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# Copy application code
COPY app/ ./app/
COPY migrations/ ./migrations/
COPY alembic.ini ./

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Frontend Integration Changes

### Files to Modify (minimal surface area)

Only 3-4 frontend files need changes to swap mock for real:

| File | Change | Why |
|------|--------|-----|
| `src/api/grading.ts` | Replace mock delay + return with Axios POST to `/api/grade` | Core integration point |
| `src/stores/profile-store.ts` | Replace mock signIn with real POST to `/api/auth/login`, store JWT | Auth integration |
| `src/api/types.ts` | Add auth types (LoginRequest, TokenResponse) | New auth endpoints |
| New: `src/api/auth.ts` | Register, login, getMe functions | Auth API layer |
| New: `src/lib/axios.ts` | Axios instance with base URL + auth interceptor | JWT token attachment |

### Axios Instance with Auth

```typescript
// src/lib/axios.ts
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Updated grading.ts

```typescript
// src/api/grading.ts -- the ONLY grading change
import api from "@/lib/axios";
import type { GradeEssayRequest, GradingResult } from "./types";

export async function gradeEssay(request: GradeEssayRequest): Promise<GradingResult> {
  const formData = new FormData();
  formData.append("essay_text", request.essayText);
  formData.append("grade_level", request.gradeLevel);
  if (request.rubricFile) {
    formData.append("rubric_file", request.rubricFile);
  }

  const { data } = await api.post<GradingResult>("/grade", formData);
  return data;
}
```

**Note:** The rubric PDF file is sent as multipart form data to the backend. Server-side PDF parsing replaces client-side extraction. The `rubricText` field in the request becomes unnecessary -- the backend extracts text from the PDF itself. However, keep `rubricText` as a fallback for cases where users paste rubric text directly (no PDF).

### PDF Handling Migration

Currently the frontend extracts PDF text client-side via `unpdf` and sends `rubricText` as a string. With the backend:

1. **Primary:** Send the raw PDF file via multipart upload. Backend extracts text with PyMuPDF (faster, more reliable than browser-based extraction).
2. **Fallback:** If no PDF but rubric text was pasted, send `rubricText` as a string field.
3. The `unpdf` dependency can be removed from the frontend after backend integration is complete.

## Patterns to Follow

### Pattern 1: Repository Pattern for Database Access
**What:** Thin service layer between routes and SQLAlchemy queries.
**When:** All database operations.
**Why:** Keeps route handlers clean, makes testing easier (mock the service, not the ORM).

### Pattern 2: Dependency Injection for Auth
**What:** FastAPI's `Depends()` system for JWT verification.
**When:** All protected endpoints.
```python
@router.get("/submissions")
async def list_submissions(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ...
```

### Pattern 3: Pydantic Settings for Configuration
**What:** All config via environment variables, validated by Pydantic BaseSettings.
**When:** Database URLs, JWT secrets, inference endpoints.
**Why:** Type-safe config, .env file support, no hardcoded secrets.

### Pattern 4: Async Everything in the Hot Path
**What:** Use async for all I/O: database queries (asyncpg), HTTP calls (httpx), file reads.
**When:** All request handlers.
**Why:** LLM inference takes 10-60 seconds. Blocking the event loop means no concurrent requests.

### Pattern 5: Structured LLM Output Validation
**What:** Parse LLM JSON output through Pydantic models before storing.
**When:** After every inference call.
**Why:** LLMs produce malformed JSON, missing fields, wrong types. Validate and retry (up to 2x) or return a structured error.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Inference Service Inside Docker Compose
**What:** Running Ollama or vLLM as a Docker Compose service alongside the backend.
**Why bad:** GPU passthrough is platform-dependent (no GPU access on macOS Docker). Model downloads bloat the container. Coupling inference lifecycle to backend lifecycle means restarting the backend reloads a 2GB model.
**Instead:** Run inference service independently. Backend connects via configurable HTTP URL.

### Anti-Pattern 2: Synchronous ORM Queries in Async Routes
**What:** Using SQLAlchemy sync sessions in async FastAPI route handlers.
**Why bad:** Blocks the event loop. During a 30-second LLM inference call, no other requests can be served.
**Instead:** Use `create_async_engine` + `AsyncSession` + `asyncpg` driver throughout.

### Anti-Pattern 3: Storing JWT Tokens in Cookies with httpOnly
**What:** Setting auth tokens as httpOnly cookies for "security."
**Why bad:** Adds CSRF complexity, breaks the existing Axios interceptor pattern, and this is a course project -- not a bank. The frontend already uses localStorage for Zustand persistence.
**Instead:** Return JWT in response body. Frontend stores in localStorage. Axios interceptor attaches to requests. Simple and sufficient for this scope.

### Anti-Pattern 4: Building a Custom Inference Protocol
**What:** Inventing a custom REST API between FastAPI and the model server.
**Why bad:** Every model server (Ollama, vLLM, llama.cpp server, cloud APIs) already speaks OpenAI's chat completions format. Building a custom protocol means writing adapters for each.
**Instead:** Use `/v1/chat/completions` everywhere. One client implementation, many backends.

### Anti-Pattern 5: Eager Loading Everything from Database
**What:** Using `joinedload` for categories and highlights on every query.
**Why bad:** The history endpoint only needs excerpt + score (no categories/highlights). Loading full results for list views wastes bandwidth and query time.
**Instead:** Two query patterns: lightweight for lists (`SELECT id, essay_excerpt, overall_score, graded_at`), full for detail view (with joined categories + highlights).

## Scalability Considerations

| Concern | At 1 User (Dev) | At 10 Users | At 100 Users |
|---------|-----------------|-------------|-------------- |
| Inference latency | 10-60s per request, acceptable | Queue builds up, requests timeout | Need inference queue or multiple model instances |
| Database connections | Single connection fine | asyncpg pool (5 connections) | Increase pool size to 20 |
| Concurrent grading | Sequential, one at a time | Async handles I/O overlap but inference is the bottleneck | Add background task queue (Celery/ARQ) for grading |
| PDF processing | <1s per PDF, negligible | Still negligible | Still negligible |

**For the course project scope (1-5 concurrent users): no queue needed.** Async FastAPI handles the I/O overlap. The inference service is the bottleneck, not the backend.

## Suggested Build Order (Dependencies)

Each step builds on the previous. This order respects dependency chains.

| Order | Component | Depends On | Rationale |
|-------|-----------|------------|-----------|
| 1 | Project scaffold: pyproject.toml, Dockerfile, docker-compose.yml, app/main.py with CORS | Nothing | Everything else needs the project to exist |
| 2 | Config (Pydantic BaseSettings) + database.py (async engine/session) | Step 1 | All modules need config and DB access |
| 3 | Alembic setup + User model + initial migration | Step 2 | Auth depends on User table existing |
| 4 | Auth module (register, login, JWT, get_current_user dependency) | Step 3 | Grading routes need auth dependency |
| 5 | Submission/Category/Highlight models + migration | Step 2 | Grading module needs these tables |
| 6 | PDF parser (PyMuPDF wrapper) | Step 1 | Grading pipeline needs rubric text extraction |
| 7 | Inference client (OpenAI-compat + prompt engineering) | Step 2 | Grading pipeline needs LLM calls |
| 8 | Grading service + router (orchestrates 6+7, stores in DB) | Steps 4, 5, 6, 7 | Core feature, depends on all pieces |
| 9 | History endpoints (list + detail) | Steps 4, 5 | Read-only queries on existing data |
| 10 | Frontend integration (axios instance, auth store, grading.ts swap) | Steps 4, 8 | Backend must be running and tested first |

**Phase groupings for the roadmap:**
- **Infrastructure** (steps 1-3): Scaffold, config, database, migrations
- **Auth** (step 4): Registration, login, JWT
- **Grading pipeline** (steps 5-8): Models, PDF, inference, orchestration
- **Integration** (steps 9-10): History API, frontend swap

## Sources

- Existing codebase analysis: `src/api/types.ts`, `src/api/grading.ts`, `src/stores/`, `src/lib/pdf-extract.ts`
- [FastAPI official docs: OAuth2 with JWT](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/) -- auth patterns
- [FastAPI official docs: Docker deployment](https://fastapi.tiangolo.com/deployment/docker/) -- Dockerfile patterns
- [FastAPI official docs: Bigger Applications](https://fastapi.tiangolo.com/tutorial/bigger-applications/) -- project structure
- [Ollama OpenAI compatibility](https://ollama.com/blog/openai-compatibility) -- inference protocol
- [vLLM or llama.cpp: Choosing the right engine](https://developers.redhat.com/articles/2025/09/30/vllm-or-llamacpp-choosing-right-llm-inference-engine-your-use-case) -- inference server comparison
- [Building async APIs with FastAPI, SQLAlchemy 2.0, asyncpg](https://leapcell.io/blog/building-high-performance-async-apis-with-fastapi-sqlalchemy-2-0-and-asyncpg) -- database patterns
- [Setup FastAPI with Async SQLAlchemy 2, Alembic, PostgreSQL, Docker](https://berkkaraal.com/blog/2024/09/19/setup-fastapi-project-with-async-sqlalchemy-2-alembic-postgresql-and-docker/) -- full stack setup
- [FastAPI best practices (zhanymkanov)](https://github.com/zhanymkanov/fastapi-best-practices) -- conventions
- [PyMuPDF documentation](https://pymupdf.readthedocs.io/en/latest/about.html) -- PDF extraction performance
