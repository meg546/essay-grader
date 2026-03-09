# Technology Stack

**Project:** AI Essay Grader v2.0 Backend Implementation
**Researched:** 2026-03-09
**Confidence:** HIGH
**Scope:** New Python/FastAPI backend with LLM serving, PostgreSQL, JWT auth, server-side PDF parsing, Docker Compose, and frontend integration points

## Existing Frontend Stack (validated, DO NOT change)

| Technology | Version | Purpose |
|------------|---------|---------|
| React | ^19.2.0 | UI framework |
| Vite | ^7.3.1 | Build tool |
| TypeScript | ~5.9.3 | Type safety |
| Tailwind CSS v4 | ^4.2.1 | Styling |
| Zustand | ^5.0.11 | State management (with persist middleware) |
| React Router | ^7.13.1 | Routing |
| Axios | (to add) | HTTP client for real API calls |
| unpdf | ^1.4.0 | Client-side PDF extraction (keep as fallback) |

**Note:** Axios is listed in PROJECT.md constraints but not in package.json. It will need to be added when swapping mock API for real backend calls.

## Recommended Backend Stack

### Core Framework

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Python | 3.12 | Runtime | Stable, widely supported by all ML libraries. 3.13 has known issues with passlib/bcrypt compatibility. 3.12 is the safe choice for ML workloads in 2026. |
| FastAPI | >=0.115.0 (latest 0.135.x) | Web framework | Already specified in project requirements. Async-native, automatic OpenAPI docs, Pydantic v2 integration, first-class type hints. The standard for Python ML-serving APIs. |
| Uvicorn | >=0.32.0 | ASGI server | Default FastAPI server. Use `uvicorn[standard]` for uvloop performance on Linux (falls back gracefully on macOS). |
| Pydantic | v2 (bundled with FastAPI) | Data validation/serialization | FastAPI's native validation layer. V2 is a Rust-backed rewrite -- 5-50x faster than v1. Define response models matching existing TypeScript types. |

### Database

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| PostgreSQL | 16 | Primary database | Robust, well-supported, handles JSON columns for flexible grading result storage. Docker image readily available. |
| SQLAlchemy | >=2.0 | ORM | SQLAlchemy 2.0's async engine with asyncpg is the established FastAPI pattern. Type-safe query building, migration support via Alembic. |
| asyncpg | >=0.29.0 | Async PostgreSQL driver | Purpose-built async driver for PostgreSQL. Required by SQLAlchemy's async engine. Significantly faster than psycopg2 for async workloads. |
| Alembic | >=1.13.0 | Database migrations | The only serious migration tool for SQLAlchemy. Autogenerate migrations from model changes. Use sync engine for migrations even with async app (established best practice). |

### Authentication

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| PyJWT | >=2.9.0 | JWT token creation/verification | Simpler and more focused than python-jose. FastAPI's official docs now reference PyJWT. python-jose has lower maintenance activity. |
| pwdlib[argon2,bcrypt] | >=0.2.0 | Password hashing | Modern replacement for the unmaintained passlib. Supports Argon2 (recommended) with bcrypt fallback. FastAPI ecosystem (fastapi-users) has already migrated to pwdlib. passlib breaks on Python 3.13 due to deprecated crypt module. |
| python-multipart | >=0.0.9 | Form data parsing | Required by FastAPI for any form/file upload endpoints. Must be installed explicitly. |

### LLM Serving

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Ollama | latest | Local LLM serving (development) | Simplest path to running Llama 3.2 3B locally during development. One command to pull and serve. Exposes OpenAI-compatible REST API on localhost:11434. No GPU compilation headaches. Supports GGUF quantized models out of the box. |
| httpx | >=0.27.0 | Async HTTP client for LLM API calls | FastAPI backend calls Ollama/vLLM via HTTP. httpx is async-native and the recommended HTTP client in the FastAPI ecosystem. Do NOT use requests (blocking) in an async FastAPI app. |

**LLM Architecture Decision: HTTP API, not in-process**

The backend should call the LLM via HTTP (Ollama in dev, vLLM or similar in production), NOT load the model in-process with llama-cpp-python. Reasons:

1. **Decoupled scaling** -- LLM inference and API serving have different resource profiles. Running them in the same process means a long inference blocks API requests.
2. **Flexibility** -- The PROJECT.md specifies "configurable endpoint (local/LAN/cloud GPU)." An HTTP-based approach makes switching between local Ollama, a LAN vLLM server, or a cloud GPU endpoint a config change, not a code change.
3. **Memory isolation** -- Llama 3.2 3B (even quantized Q4) uses 2-4GB RAM. Keeping it in a separate process prevents OOM killing the API server.
4. **Development experience** -- Ollama handles model downloading, quantization selection, and GPU offloading. llama-cpp-python requires compiling against CUDA/Metal and managing GGUF files manually.

**Production path:** When deploying with a dedicated GPU, swap Ollama for vLLM (latest, supports Llama 3.2 natively) behind the same HTTP interface. vLLM provides continuous batching and higher throughput for concurrent users.

### PDF Parsing (Server-Side)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| pypdf | >=4.0.0 | Server-side PDF text extraction | MIT-licensed, pure Python, zero system dependencies. For rubric PDFs (primarily text-based academic documents), pypdf extracts text reliably without the complexity or AGPL licensing of PyMuPDF. Installs cleanly in Docker with no C dependencies. |

**Why NOT PyMuPDF:** AGPL-licensed. Any application using PyMuPDF must itself be AGPL or purchase a commercial license. For an academic project that may be shared or deployed, AGPL is a legal landmine. pypdf handles text extraction from rubric PDFs (which are text-heavy documents, not scanned images) without this risk.

**Why NOT pdfplumber:** Built on pdfminer.six, significantly slower than pypdf. The extra precision pdfplumber offers (table extraction, coordinate-level positioning) is unnecessary for extracting rubric text.

**Fallback strategy:** The frontend already has `unpdf` for client-side extraction. The backend should attempt server-side extraction with pypdf, and if the result is empty/garbage (scanned PDF), return a flag telling the frontend to use its client-side extraction or display a "text-based PDF required" message.

### Infrastructure

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Docker | latest | Containerization | Required for reproducible backend deployment. Isolates Python environment from host. |
| Docker Compose | v2 | Multi-container orchestration | Runs FastAPI + PostgreSQL (+ optionally Ollama) as a single `docker compose up`. Simple for development and demo deployment. |
| python-dotenv | >=1.0.0 | Environment variable management | Load `.env` files for database URLs, JWT secrets, LLM endpoint URLs. Standard pattern for 12-factor app config. |

### Development & Testing

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| pytest | >=8.0.0 | Testing framework | Standard Python testing. Use with pytest-asyncio for async endpoint tests. |
| pytest-asyncio | >=0.24.0 | Async test support | Required for testing async FastAPI endpoints and database operations. |
| httpx | (same as above) | Test client | FastAPI's recommended test client uses httpx via `TestClient` / `ASGITransport`. |
| ruff | >=0.8.0 | Linting + formatting | Replaces flake8+black+isort in a single Rust-based tool. Fast, opinionated, zero-config. |

## Frontend Integration Points

### What Changes in the Frontend

| Change | Description | Dependency Impact |
|--------|-------------|-------------------|
| Add Axios | HTTP client for real API calls | `npm install axios` (already in constraints) |
| Add TanStack Query | Server state management, caching, loading/error states | `npm install @tanstack/react-query` -- replaces manual loading state in Zustand for API data |
| Update API layer | Replace mock function bodies in `src/api/grading.ts` and `src/api/history.ts` with real Axios calls | No new dependency; same typed interfaces |
| Auth token storage | Store JWT in memory (Zustand) + refresh token in httpOnly cookie or localStorage | No new dependency |
| Axios interceptor | Attach JWT Bearer token to all API requests; handle 401 refresh/redirect | No new dependency |
| Environment config | `VITE_API_BASE_URL` environment variable for API endpoint | No new dependency |

### API Contract (must match existing TypeScript types)

The backend must return JSON matching these existing frontend types exactly:

- `GradingResult` -- returned by `POST /api/grade`
- `HistoryItem[]` -- returned by `GET /api/history`
- `GradingResult` -- returned by `GET /api/history/:id`

New endpoints needed:
- `POST /api/auth/register` -- email + password
- `POST /api/auth/login` -- returns JWT access + refresh tokens
- `POST /api/auth/refresh` -- refresh access token
- `GET /api/auth/me` -- current user profile

### What NOT to Change in the Frontend

- Do NOT replace Zustand with Redux or any other state manager
- Do NOT add next-auth, Clerk, or any frontend auth library -- JWT handling is simple Axios interceptor + Zustand
- Do NOT remove unpdf -- keep client-side PDF extraction as fallback
- Do NOT add SSR or change from SPA -- Vite SPA calling FastAPI is the correct architecture

## Installation

### Backend (Python)

```bash
# Create project
mkdir backend && cd backend
python3.12 -m venv .venv
source .venv/bin/activate

# Core
pip install "fastapi[standard]" uvicorn[standard] pydantic

# Database
pip install "sqlalchemy[asyncio]" asyncpg alembic

# Authentication
pip install pyjwt "pwdlib[argon2,bcrypt]" python-multipart

# PDF parsing
pip install pypdf

# LLM client
pip install httpx

# Config
pip install python-dotenv

# Development
pip install pytest pytest-asyncio httpx ruff
```

### Frontend Additions

```bash
# From project root
npm install axios @tanstack/react-query
```

### Docker Compose (reference)

```yaml
# docker-compose.yml
services:
  api:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/essay_grader
      - LLM_ENDPOINT=http://ollama:11434
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=essay_grader
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  # Optional: Ollama for local LLM serving
  # ollama:
  #   image: ollama/ollama
  #   ports:
  #     - "11434:11434"
  #   volumes:
  #     - ollama_models:/root/.ollama

volumes:
  pgdata:
  # ollama_models:
```

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| ORM | SQLAlchemy 2.0 async | SQLModel | SQLModel is a thin wrapper by FastAPI's author but has fewer features, weaker migration tooling, and the abstraction adds confusion without value for developers who know SQLAlchemy |
| ORM | SQLAlchemy 2.0 async | Tortoise ORM | Smaller ecosystem, fewer contributors, less documentation. SQLAlchemy is the industry standard. |
| DB Driver | asyncpg | psycopg3 (async) | asyncpg is more mature for async PostgreSQL and has better benchmarks. psycopg3 is viable but less battle-tested in the async FastAPI ecosystem. |
| Password hashing | pwdlib | passlib | passlib is unmaintained since 2020, breaks on Python 3.13, has bcrypt version conflicts. pwdlib is the active replacement endorsed by the FastAPI ecosystem. |
| Password hashing | pwdlib | bcrypt (direct) | Direct bcrypt usage requires manual salt handling and lacks the hash-scheme-rotation that pwdlib provides (migrate users from bcrypt to argon2 transparently). |
| JWT | PyJWT | python-jose | python-jose has lower maintenance activity. PyJWT is simpler, does one thing well, and is what FastAPI's updated docs reference. |
| PDF extraction | pypdf | PyMuPDF | AGPL license. Faster, but the license makes it unsuitable unless you AGPL your entire app or buy a commercial license. Rubric PDFs are text-heavy; pypdf is sufficient. |
| PDF extraction | pypdf | pdfplumber | Slower (pdfminer.six-based), heavier. Table extraction capability is unnecessary for rubric text. |
| LLM serving | Ollama (HTTP) | llama-cpp-python (in-process) | In-process model loading blocks the event loop, couples scaling, and requires native compilation. HTTP-based serving is more flexible and matches the "configurable endpoint" requirement. |
| LLM serving | Ollama (dev) | vLLM (dev) | vLLM requires NVIDIA GPU and CUDA. Ollama runs on CPU and Apple Silicon out of the box. Use vLLM for production GPU serving only. |
| HTTP client | httpx | aiohttp | httpx is the FastAPI ecosystem standard (used in TestClient). Better API design, sync+async in one library. aiohttp is older and more verbose. |
| HTTP client | httpx | requests | requests is synchronous. Using it in async FastAPI blocks the event loop. Never use requests in FastAPI. |
| Linting | ruff | flake8 + black + isort | ruff replaces all three in a single tool, runs 10-100x faster (Rust-based), and is now the community default for new Python projects. |
| Server state (frontend) | TanStack Query | SWR | TanStack Query has richer features (mutations, optimistic updates, devtools). SWR is simpler but lacks mutation primitives needed for grading submissions. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| passlib | Unmaintained since 2020, breaks on Python 3.13, bcrypt version conflicts | pwdlib[argon2,bcrypt] |
| requests (in FastAPI) | Synchronous -- blocks the async event loop | httpx (async-native) |
| PyMuPDF | AGPL license contaminates entire application | pypdf (MIT) |
| SQLModel | Thin abstraction over SQLAlchemy that adds confusion, weaker migration support | SQLAlchemy 2.0 directly |
| llama-cpp-python (in-process) | Blocks event loop, couples API + inference scaling, requires native compilation | Ollama via HTTP (dev), vLLM via HTTP (prod) |
| Flask | Synchronous, no native async, no automatic validation/docs | FastAPI (already chosen) |
| Django REST Framework | Heavyweight, batteries-included philosophy mismatched for an API-only LLM backend | FastAPI |
| next-auth / Clerk (frontend) | Over-engineered for JWT bearer auth; adds vendor lock-in | Axios interceptor + Zustand for token management |
| Redis (for now) | Premature optimization. No caching, rate limiting, or session needs at this scale. Add only if needed. | PostgreSQL handles all current data needs |

## Version Compatibility Matrix

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| FastAPI >=0.115 | Pydantic v2 | FastAPI 0.100+ requires Pydantic v2. Do not install Pydantic v1. |
| SQLAlchemy >=2.0 | asyncpg >=0.29 | Use `postgresql+asyncpg://` connection string |
| SQLAlchemy >=2.0 | Alembic >=1.13 | Alembic migrations use sync engine even with async app |
| pwdlib >=0.2 | Python 3.12 | Replaces passlib; install `pwdlib[argon2,bcrypt]` for both algorithms |
| PyJWT >=2.9 | Python 3.12 | For RS256 signing, install `pyjwt[crypto]`. HS256 (simpler, fine for single-server) needs no extras. |
| Ollama | Llama 3.2 3B | Run `ollama pull llama3.2:3b` to download. Serves on port 11434 by default. |
| Docker Compose v2 | PostgreSQL 16 | Use `postgres:16-alpine` image for smaller size |

## Stack Patterns by Variant

**If developing on Apple Silicon Mac (likely given darwin platform):**
- Ollama runs natively with Metal acceleration -- no Docker needed for LLM serving
- Run Ollama on host, PostgreSQL in Docker, FastAPI on host for fastest dev loop
- Set `LLM_ENDPOINT=http://localhost:11434` in `.env`

**If deploying to cloud with NVIDIA GPU:**
- Replace Ollama with vLLM for production throughput
- vLLM provides continuous batching, PagedAttention, and OpenAI-compatible API
- Set `LLM_ENDPOINT=http://vllm-host:8000` in `.env`
- Same backend code, different endpoint URL

**If no GPU available (CI/testing):**
- Mock the LLM endpoint in tests (return canned grading responses)
- Use a lightweight model via Ollama CPU mode for integration testing
- Backend should have a `MOCK_LLM=true` env var that returns fixture data

## Sources

- [FastAPI PyPI](https://pypi.org/project/fastapi/) -- version 0.135.x confirmed current (March 2026)
- [FastAPI JWT tutorial](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/) -- official auth pattern reference
- [FastAPI file upload docs](https://fastapi.tiangolo.com/tutorial/request-files/) -- python-multipart requirement confirmed
- [pwdlib GitHub](https://github.com/frankie567/pwdlib) -- passlib replacement, endorsed by fastapi-users ecosystem
- [pwdlib PyPI](https://pypi.org/project/pwdlib/) -- version and install extras confirmed
- [passlib maintenance discussion](https://github.com/fastapi/fastapi/discussions/11773) -- community confirmation passlib is unmaintained
- [SQLAlchemy asyncpg guide](https://leapcell.io/blog/building-high-performance-async-apis-with-fastapi-sqlalchemy-2-0-and-asyncpg) -- async setup patterns (HIGH confidence, multiple sources agree)
- [Alembic async setup](https://berkkaraal.com/blog/2024/09/19/setup-fastapi-project-with-async-sqlalchemy-2-alembic-postgresql-and-docker/) -- migration configuration with async engine
- [PyMuPDF licensing](https://github.com/pymupdf/PyMuPDF/discussions/971) -- AGPL confirmed
- [pypdf docs](https://pypdf.readthedocs.io/en/latest/) -- MIT license, pure Python
- [Ollama vs llama.cpp comparison](https://www.openxcell.com/blog/llama-cpp-vs-ollama/) -- architecture tradeoffs
- [Ollama vs vLLM benchmark](https://www.sitepoint.com/ollama-vs-vllm-performance-benchmark-2026/) -- production serving comparison
- [llama-cpp-python PyPI](https://pypi.org/project/llama-cpp-python/) -- version 0.3.x confirmed
- [vLLM releases](https://github.com/vllm-project/vllm/releases) -- active as of March 2026

---
*Stack research for: AI Essay Grader v2.0 Backend*
*Researched: 2026-03-09*
