# Phase 11: Backend Foundation - Research

**Researched:** 2026-03-09
**Domain:** FastAPI + PostgreSQL + Docker Compose project scaffold
**Confidence:** HIGH

## Summary

This phase creates the backend infrastructure shell: a FastAPI server with PostgreSQL in Docker Compose, Pydantic response models matching the existing frontend TypeScript types, and Alembic migration support. No business logic -- just the skeleton that subsequent phases (auth, grading, persistence) build on.

The technology stack is well-established and heavily documented. FastAPI 0.135.x with SQLAlchemy 2.0 async, Pydantic v2, and uv for dependency management is the current standard pattern. The main implementation challenge is getting the Pydantic camelCase serialization to exactly match the frontend TypeScript interfaces, and wiring up the async Alembic env.py correctly.

**Primary recommendation:** Use `fastapi[standard]`, `sqlalchemy[asyncio]` with `asyncpg`, `alembic` (async template), and `pydantic-settings`. Use uv for dependency management. Target Python 3.12.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Monorepo: backend/ folder alongside existing frontend src/
- docker-compose.yml at repo root (orchestrates full project)
- Single .env at repo root for all config (DB URL, CORS origin, model endpoint)
- Flat app/ package layout: backend/app/ with models/, routes/, schemas/ subpackages, plus config.py, database.py, deps.py
- Hybrid development: PostgreSQL in Docker, FastAPI runs natively with `uvicorn app.main:app --reload`
- docker-compose.yml includes both a `db` service (for dev) and a full `backend` service (for demo/CI)
- uv for Python dependency management (pyproject.toml + uv.lock)
- Python 3.12 target
- Frontend types to match are in src/api/types.ts: GradingResult, CategoryScore, HighlightRange, HistoryItem, GradeEssayRequest
- API base URL is http://localhost:8000/api (already configured in frontend)

### Claude's Discretion
- Exact Alembic configuration and migration naming
- Pydantic model field ordering and validator details
- Docker health check implementation
- CORS middleware configuration details
- Initial test structure (if any)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | FastAPI project scaffold with async config, environment variables, and Uvicorn server | Standard stack section covers FastAPI + pydantic-settings + uvicorn setup |
| INFRA-02 | Docker Compose orchestrating FastAPI + PostgreSQL with health checks | Architecture Patterns section covers docker-compose.yml with health checks |
| INFRA-03 | CORS middleware configured for Vite dev server origin | Code Examples section covers CORSMiddleware setup |
| INFRA-04 | Pydantic response models matching frontend TypeScript types with camelCase alias generation | Code Examples section covers alias_generator pattern and exact model definitions |
| INFRA-05 | Alembic migration setup with initial schema migration | Architecture Patterns section covers async Alembic init and env.py |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| fastapi[standard] | >=0.135.0 | Web framework with uvicorn, pydantic included | De facto Python async API framework; `[standard]` includes uvicorn, pydantic |
| sqlalchemy[asyncio] | >=2.0.46 | Async ORM + connection management | Industry standard ORM; `[asyncio]` pulls in greenlet for async support |
| asyncpg | >=0.31.0 | PostgreSQL async driver | Fastest Python PostgreSQL driver for async; used by SQLAlchemy async dialect |
| alembic | >=1.18.0 | Database migrations | Only production-grade migration tool for SQLAlchemy |
| pydantic-settings | >=2.13.0 | Environment variable / .env config | Official Pydantic extension for BaseSettings; separated from pydantic v2 core |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| python-multipart | >=0.0.18 | Form/file upload parsing | Needed for PDF upload in Phase 13; included by fastapi[standard] |
| httpx | >=0.28.0 | Async HTTP test client | For pytest-based API testing; included by fastapi[standard] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| asyncpg | psycopg3 (async) | psycopg3 is newer with sync+async, but asyncpg is faster and more battle-tested for pure async |
| SQLAlchemy | SQLModel | SQLModel adds Pydantic integration but limits control; separate models/schemas is cleaner |

**Installation (from backend/ directory):**
```bash
uv init --app
uv add "fastapi[standard]" "sqlalchemy[asyncio]" asyncpg alembic pydantic-settings
```

## Architecture Patterns

### Recommended Project Structure
```
essay-grader/
├── .env                          # All config (DB, CORS, etc.)
├── docker-compose.yml            # db + backend services
├── backend/
│   ├── pyproject.toml            # uv-managed dependencies
│   ├── uv.lock                   # Lockfile
│   ├── alembic.ini               # Alembic config (points to alembic/)
│   ├── alembic/
│   │   ├── env.py                # Async env.py (from --template async)
│   │   ├── script.py.mako        # Migration template
│   │   └── versions/             # Migration files
│   └── app/
│       ├── __init__.py
│       ├── main.py               # FastAPI app factory, CORS, router includes
│       ├── config.py             # pydantic-settings BaseSettings
│       ├── database.py           # create_async_engine, async session factory
│       ├── deps.py               # Depends() callables (get_db, etc.)
│       ├── models/
│       │   ├── __init__.py
│       │   └── base.py           # DeclarativeBase with naming conventions
│       ├── schemas/
│       │   ├── __init__.py
│       │   ├── base.py           # CamelModel base with alias_generator
│       │   ├── grading.py        # GradingResult, CategoryScore, HighlightRange
│       │   └── history.py        # HistoryItem
│       └── routes/
│           ├── __init__.py
│           └── health.py         # GET /api/health (smoke test)
├── src/                          # Existing frontend
└── package.json                  # Existing frontend
```

### Pattern 1: CamelCase Base Schema
**What:** A base Pydantic model that all response schemas inherit from, providing camelCase JSON output.
**When to use:** Every response schema in this project.
**Why:** Frontend expects camelCase; Python convention is snake_case. The alias_generator bridges this.

### Pattern 2: Async Database Session via Dependency Injection
**What:** FastAPI Depends() that yields an AsyncSession, auto-commits/rolls back.
**When to use:** Every route that touches the database.
**Why:** Ensures proper session lifecycle without manual cleanup.

### Pattern 3: Settings Singleton via lru_cache
**What:** A `get_settings()` function decorated with `@lru_cache` that returns the BaseSettings instance.
**When to use:** As a FastAPI dependency and in database.py/alembic env.py.
**Why:** Reads .env once, reuses everywhere. Testable via dependency override.

### Pattern 4: Hybrid Docker Compose
**What:** docker-compose.yml with `db` service (always used) and `backend` service (for demo/CI only).
**When to use:** Dev runs FastAPI natively with `uvicorn --reload`; CI/demo runs everything in Docker.
**Why:** Faster dev iteration (no container rebuild), but reproducible full-stack via compose.

### Anti-Patterns to Avoid
- **Sync SQLAlchemy in async FastAPI:** Never use `create_engine` or synchronous `Session` -- always `create_async_engine` and `AsyncSession`. Mixing sync blocks the event loop.
- **Hardcoded database URLs:** Always load from environment via pydantic-settings. Never commit credentials.
- **Alembic with sync driver when app uses async:** Alembic's async template handles this. Don't use the default (sync) template.
- **populate_by_name=False with alias_generator:** Without `populate_by_name=True`, you can't instantiate models using Python snake_case names. Always set both.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| camelCase serialization | Custom serializer/dict transform | Pydantic `alias_generator=to_camel` | Handles nested models, edge cases, validation aliases automatically |
| Environment config | os.environ[] lookups | pydantic-settings BaseSettings | Type validation, .env file support, documentation via type hints |
| Database migrations | Raw SQL scripts | Alembic with --autogenerate | Tracks state, handles rollbacks, detects model changes automatically |
| Health checks | Custom shell scripts | Docker HEALTHCHECK + pg_isready / curl | Native Docker orchestration, restart policies |
| Async session management | Manual try/finally | FastAPI Depends() + async context manager | Automatic cleanup, testable via dependency overrides |

**Key insight:** Every "simple" hand-rolled solution in this stack has edge cases (transaction rollback, connection pooling, migration ordering) that the standard tools handle correctly.

## Common Pitfalls

### Pitfall 1: Alembic Can't Find Models for Autogenerate
**What goes wrong:** `alembic revision --autogenerate` produces empty migrations.
**Why it happens:** `target_metadata` in env.py doesn't import all model modules, so Base.metadata has no tables registered.
**How to avoid:** In alembic/env.py, import the Base from app.models.base AND import all model modules (e.g., `from app.models import base`). The models must be imported so their table definitions register on the metadata.
**Warning signs:** Migration file has empty `upgrade()` and `downgrade()` functions.

### Pitfall 2: .env File Not Found by pydantic-settings
**What goes wrong:** Settings load with default values instead of .env values.
**Why it happens:** pydantic-settings resolves .env relative to CWD, not relative to the settings file. Running uvicorn from backend/ won't find ../.env.
**How to avoid:** Use `env_file=Path(__file__).resolve().parent.parent.parent / ".env"` or set `env_file="../.env"` and always run from backend/ directory. Document the expected CWD.
**Warning signs:** Database connection fails with default/empty URL.

### Pitfall 3: asyncpg URL Scheme Mismatch
**What goes wrong:** SQLAlchemy raises "could not determine dialect" or asyncpg is not used.
**Why it happens:** DATABASE_URL uses `postgresql://` instead of `postgresql+asyncpg://`.
**How to avoid:** In config.py, either require the full async URL or transform it: `url.replace("postgresql://", "postgresql+asyncpg://")`.
**Warning signs:** Sync driver used accidentally, blocking the event loop.

### Pitfall 4: Pydantic Model Serialization Missing by_alias
**What goes wrong:** JSON responses use snake_case instead of camelCase despite alias_generator.
**Why it happens:** FastAPI's `response_model` serialization uses `by_alias=True` by default, BUT if you return a dict instead of a model, aliases aren't applied.
**How to avoid:** Always return Pydantic model instances from routes (not dicts). Or set `model_config = ConfigDict(populate_by_name=True)` and rely on FastAPI's automatic serialization.
**Warning signs:** Frontend receives `overall_score` instead of `overallScore`.

### Pitfall 5: Docker Compose Service Startup Order
**What goes wrong:** Backend starts before PostgreSQL is ready, connection refused.
**Why it happens:** `depends_on` only waits for container start, not service readiness.
**How to avoid:** Use `depends_on: db: condition: service_healthy` with a `pg_isready` health check on the db service.
**Warning signs:** Backend crashes on first startup, works on restart.

## Code Examples

### CamelCase Base Schema (schemas/base.py)
```python
# Source: Pydantic v2 official docs - alias_generators
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,       # Allow both snake_case and camelCase input
        from_attributes=True,        # Enable ORM mode (read from SQLAlchemy models)
    )
```

### Response Schema Example (schemas/grading.py)
```python
from .base import CamelModel


class HighlightRange(CamelModel):
    start: int
    end: int
    category_id: str
    type: str  # "strength" | "improvement"
    feedback: str


class CategoryScore(CamelModel):
    id: str
    name: str
    score: float
    max_score: float
    strengths: list[str]
    improvements: list[str]
    justification: str
    highlights: list[HighlightRange]


class GradingResult(CamelModel):
    id: str
    essay_text: str
    essay_excerpt: str
    overall_score: float
    max_score: float
    summary: str
    categories: list[CategoryScore]
    graded_at: str


class HistoryItem(CamelModel):
    id: str
    essay_excerpt: str
    overall_score: float
    max_score: float
    category_count: int
    graded_at: str
```

### Settings (config.py)
```python
# Source: pydantic-settings official docs
from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parent.parent.parent / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/essaygrader"
    cors_origins: list[str] = ["http://localhost:5173"]
    debug: bool = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

### Async Database Setup (database.py)
```python
# Source: SQLAlchemy 2.0 async docs
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from .config import get_settings

settings = get_settings()
engine = create_async_engine(settings.database_url, echo=settings.debug)
async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
```

### Database Dependency (deps.py)
```python
from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from .database import async_session_factory


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session
```

### FastAPI App (main.py)
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import get_settings
from .routes import health

settings = get_settings()

app = FastAPI(title="Essay Grader API", root_path="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
```

Note: `root_path="/api"` vs an `APIRouter(prefix="/api")` -- either approach works. Using a router prefix is more common and avoids OpenAPI docs path issues. The planner should decide which approach:
```python
# Alternative: prefix-based (recommended)
app = FastAPI(title="Essay Grader API")
api_router = APIRouter(prefix="/api")
api_router.include_router(health.router)
app.include_router(api_router)
```

### Health Route (routes/health.py)
```python
from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    return {"status": "ok"}
```

### Docker Compose (docker-compose.yml)
```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: essaygrader
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    env_file:
      - .env
    depends_on:
      db:
        condition: service_healthy
    profiles:
      - full  # Only starts with: docker compose --profile full up

volumes:
  pgdata:
```

### Backend Dockerfile (backend/Dockerfile)
```dockerfile
FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

COPY . /app
WORKDIR /app
RUN uv sync --frozen --no-cache

EXPOSE 8000
CMD ["/app/.venv/bin/uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### SQLAlchemy Declarative Base (models/base.py)
```python
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
```

### Alembic Init Command
```bash
cd backend
alembic init --template async alembic
```
Then edit `alembic/env.py` to set `target_metadata = Base.metadata` and import all models.
Edit `alembic.ini` to remove the hardcoded `sqlalchemy.url` (load from env instead in env.py).

### Example .env File
```bash
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/essaygrader
CORS_ORIGINS=["http://localhost:5173"]
DEBUG=true
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SQLAlchemy 1.4 async shim | SQLAlchemy 2.0 native async | 2023 (SA 2.0 release) | Cleaner API, proper type hints |
| passlib for hashing | pwdlib (Phase 12 concern) | 2024 (passlib unmaintained) | Different API, noted for awareness |
| pip + requirements.txt | uv + pyproject.toml | 2024-2025 | 10-100x faster installs, lockfile, PEP 621 |
| pydantic v1 orm_mode | pydantic v2 from_attributes | 2023 (pydantic v2) | ConfigDict replaces class Config |
| Separate pydantic BaseSettings | pydantic-settings package | 2023 (pydantic v2) | Must `pip install pydantic-settings` separately |

**Deprecated/outdated:**
- `class Config:` inside Pydantic models -- use `model_config = ConfigDict(...)` instead
- `orm_mode = True` -- use `from_attributes = True`
- `schema_extra` -- use `json_schema_extra`
- Sync Alembic with async app -- use `alembic init --template async`

## Open Questions

1. **API prefix approach: root_path vs router prefix**
   - What we know: Both work. `root_path` affects OpenAPI docs URL. Router prefix is more conventional.
   - What's unclear: Whether Vite proxy will be used in addition to CORS (affects path handling).
   - Recommendation: Use `APIRouter(prefix="/api")` -- simpler, no surprises with docs.

2. **SQLAlchemy model definitions in this phase**
   - What we know: Phase requires Alembic setup with "initial schema migration." No business logic tables are specified in INFRA requirements.
   - What's unclear: Whether initial migration should be empty (just proves Alembic works) or include a placeholder table.
   - Recommendation: Create a minimal `grading_results` table skeleton to prove autogenerate works. Keep it minimal; Phase 14 (persistence) will define the real schema.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest + httpx (AsyncClient) |
| Config file | backend/pyproject.toml `[tool.pytest.ini_options]` (Wave 0) |
| Quick run command | `cd backend && uv run pytest tests/ -x -q` |
| Full suite command | `cd backend && uv run pytest tests/ -v` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | FastAPI app starts and serves requests | smoke | `cd backend && uv run pytest tests/test_health.py -x` | Wave 0 |
| INFRA-02 | Docker Compose starts both services healthy | manual | `docker compose up -d && docker compose ps` (verify healthy status) | manual-only: requires Docker daemon |
| INFRA-03 | CORS headers present on responses | unit | `cd backend && uv run pytest tests/test_cors.py -x` | Wave 0 |
| INFRA-04 | Pydantic schemas serialize to camelCase matching TS types | unit | `cd backend && uv run pytest tests/test_schemas.py -x` | Wave 0 |
| INFRA-05 | Alembic generates and applies migrations | integration | `cd backend && uv run alembic upgrade head` (requires running DB) | manual-only: requires PostgreSQL |

### Sampling Rate
- **Per task commit:** `cd backend && uv run pytest tests/ -x -q`
- **Per wave merge:** `cd backend && uv run pytest tests/ -v`
- **Phase gate:** Full suite green + `docker compose up -d` both services healthy

### Wave 0 Gaps
- [ ] `backend/pyproject.toml` -- needs `[tool.pytest.ini_options]` with `asyncio_mode = "auto"`
- [ ] `backend/tests/__init__.py` -- test package
- [ ] `backend/tests/conftest.py` -- shared fixtures (async client, test app)
- [ ] `backend/tests/test_health.py` -- covers INFRA-01
- [ ] `backend/tests/test_cors.py` -- covers INFRA-03
- [ ] `backend/tests/test_schemas.py` -- covers INFRA-04
- [ ] Dev dependency: `uv add --dev pytest pytest-asyncio httpx`

## Sources

### Primary (HIGH confidence)
- [Pydantic alias_generators docs](https://docs.pydantic.dev/latest/concepts/alias/) - camelCase alias generation
- [pydantic-settings docs](https://docs.pydantic.dev/latest/concepts/pydantic_settings/) - BaseSettings configuration
- [Alembic async template](https://github.com/sqlalchemy/alembic/blob/main/alembic/templates/async/env.py) - async env.py pattern
- [uv FastAPI integration](https://docs.astral.sh/uv/guides/integration/fastapi/) - Dockerfile and project setup
- [FastAPI PyPI](https://pypi.org/project/fastapi/) - version 0.135.1 confirmed
- [SQLAlchemy PyPI](https://pypi.org/project/SQLAlchemy/) - version 2.0.46 confirmed
- [Alembic PyPI](https://pypi.org/project/alembic/) - version 1.18.4 confirmed

### Secondary (MEDIUM confidence)
- [FastAPI + SQLAlchemy async setup guide](https://berkkaraal.com/blog/2024/09/19/setup-fastapi-project-with-async-sqlalchemy-2-alembic-postgresql-and-docker/) - project structure patterns
- [Docker Compose health checks](https://last9.io/blog/docker-compose-health-checks/) - health check configuration
- [FastAPI Docker best practices](https://betterstack.com/community/guides/scaling-python/fastapi-docker-best-practices/) - Dockerfile patterns

### Tertiary (LOW confidence)
- None -- all critical claims verified with official sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All versions verified on PyPI, well-documented ecosystem
- Architecture: HIGH - Follows FastAPI official recommendations and widely-adopted patterns
- Pitfalls: HIGH - Based on documented issues in SQLAlchemy/Alembic/Pydantic repos and official docs
- camelCase serialization: HIGH - Verified exact import path and ConfigDict usage from Pydantic docs

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable ecosystem, monthly check sufficient)
