# Phase 14: Persistence & History - Research

**Researched:** 2026-03-09
**Domain:** SQLAlchemy async models, Alembic migrations, FastAPI CRUD routes
**Confidence:** HIGH

## Summary

Phase 14 adds a `submissions` table to PostgreSQL, auto-saves grading results after LLM inference, and exposes three history endpoints (list, detail, delete). The existing codebase already has all foundational patterns established: async SQLAlchemy models (User), Alembic migrations, APIRouter with auth dependencies, CamelModel Pydantic schemas, and pytest with async SQLite. The implementation is straightforward CRUD with one integration point (modifying the grading route to persist results).

The main technical consideration is JSONB column compatibility with SQLite in tests. SQLAlchemy's `JSON` type works transparently across PostgreSQL (native JSONB) and SQLite (text-serialized JSON), so tests will work without modification as long as we use `sqlalchemy.JSON` rather than the PostgreSQL-specific `JSONB` dialect type.

**Primary recommendation:** Use `sqlalchemy.JSON` (not `dialects.postgresql.JSONB`) for the result column to maintain SQLite test compatibility. Follow the exact User model pattern for the Submission model and the exact auth route pattern for history routes.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Single `submissions` table with JSONB `result` column for the full GradingResult
- Top-level columns for list-query performance: `essay_excerpt`, `overall_score`, `max_score`, `category_count`
- Full column list: id (UUID PK), user_id (FK to users), essay_text (TEXT), rubric_text (TEXT nullable), grade_level (VARCHAR), result (JSONB), essay_excerpt (VARCHAR 200), overall_score (FLOAT), max_score (FLOAT), category_count (INT), graded_at (TIMESTAMP)
- Auto-save: every grading result is persisted immediately after LLM inference completes
- POST /api/grade saves to DB automatically, returns GradingResult with the saved submission ID
- No separate "save" endpoint
- GET /api/history returns all submissions for authenticated user, sorted by graded_at descending, no pagination
- Returns HistoryItem shape: id, essayExcerpt, overallScore, maxScore, categoryCount, gradedAt
- GET /api/history/:id returns full GradingResult from JSONB column
- 404 for both missing and other-user submissions (no information leakage)
- DELETE /api/history/:id hard delete, 204 on success, 404 if not found or other user
- Frontend already has HistoryItem and GradingResult types in src/api/types.ts
- Pydantic HistoryItem schema already exists in backend/app/schemas/history.py

### Claude's Discretion
- Exact Alembic migration naming and implementation
- Whether to add an index on user_id + graded_at
- Error response message wording
- How to integrate auto-save into the existing grading route (modify route vs service layer)

### Deferred Ideas (OUT OF SCOPE)
None

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PERSIST-01 | Grading results are stored in PostgreSQL on completion (normalized schema) | Submission model with JSONB result column + auto-save in grading route; Alembic migration creates table |
| PERSIST-02 | User can view list of past submissions (GET /api/history) | History router with list endpoint querying denormalized columns; returns HistoryItem schema |
| PERSIST-03 | User can load full grading result for a past submission (GET /api/history/:id) | Detail endpoint returning JSONB result column; ownership check via user_id filter |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| SQLAlchemy | >=2.0.48 (already installed) | Submission ORM model with async support | Already used for User model, established pattern |
| Alembic | >=1.18.4 (already installed) | Schema migration for submissions table | Already used for users table |
| FastAPI | >=0.135.1 (already installed) | History API routes | Already used for auth and grading routes |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| aiosqlite | >=0.20.0 (dev, already installed) | Async SQLite for tests | All integration tests |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| sqlalchemy.JSON | dialects.postgresql.JSONB | JSONB gives PostgreSQL-specific indexing but breaks SQLite tests; JSON works on both |

**Installation:**
No new packages needed. All dependencies already installed.

## Architecture Patterns

### Recommended Project Structure
```
backend/app/
├── models/
│   ├── __init__.py        # Add Submission export
│   ├── base.py            # Existing Base
│   ├── user.py            # Existing User model
│   └── submission.py      # NEW: Submission model
├── schemas/
│   ├── base.py            # Existing CamelModel
│   ├── grading.py         # Existing GradingResult
│   └── history.py         # Existing HistoryItem (may need minor update)
├── routes/
│   ├── grading.py         # MODIFY: add auto-save after grading
│   └── history.py         # NEW: list, detail, delete endpoints
├── main.py                # MODIFY: mount history router
└── ...
backend/alembic/
├── env.py                 # MODIFY: import Submission model
└── versions/
    └── xxxx_add_submissions_table.py  # NEW: migration
```

### Pattern 1: Submission Model (following User model pattern)
**What:** SQLAlchemy ORM model with UUID PK, FK to users, JSONB result
**When to use:** The only model pattern in this phase
**Example:**
```python
# Source: Existing User model pattern in backend/app/models/user.py
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, Uuid, func
from sqlalchemy import JSON  # NOT dialects.postgresql.JSONB — SQLite compat
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("users.id"), nullable=False, index=True
    )
    essay_text: Mapped[str] = mapped_column(Text(), nullable=False)
    rubric_text: Mapped[str | None] = mapped_column(Text(), nullable=True)
    grade_level: Mapped[str] = mapped_column(String(50), nullable=False)
    result: Mapped[dict] = mapped_column(JSON(), nullable=False)
    essay_excerpt: Mapped[str] = mapped_column(String(200), nullable=False)
    overall_score: Mapped[float] = mapped_column(Float(), nullable=False)
    max_score: Mapped[float] = mapped_column(Float(), nullable=False)
    category_count: Mapped[int] = mapped_column(Integer(), nullable=False)
    graded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
```

### Pattern 2: History Router (following auth router pattern)
**What:** APIRouter with get_current_user dependency, async db session
**When to use:** All three history endpoints
**Example:**
```python
# Source: Existing auth route pattern
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.deps import get_db
from app.models.submission import Submission
from app.models.user import User
from app.schemas.history import HistoryItem

router = APIRouter(tags=["history"])


@router.get("/history")
async def list_history(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[HistoryItem]:
    result = await db.execute(
        select(Submission)
        .where(Submission.user_id == user.id)
        .order_by(Submission.graded_at.desc())
    )
    submissions = result.scalars().all()
    return [
        HistoryItem(
            id=str(s.id),
            essay_excerpt=s.essay_excerpt,
            overall_score=s.overall_score,
            max_score=s.max_score,
            category_count=s.category_count,
            graded_at=s.graded_at.isoformat(),
        )
        for s in submissions
    ]
```

### Pattern 3: Auto-save in Grading Route
**What:** After GradingService.grade() returns, persist to DB before returning response
**When to use:** Modifying the existing POST /api/grade route
**Example:**
```python
# In routes/grading.py — add db dependency, save after grading
from app.deps import get_db
from app.models.submission import Submission

@router.post("/grade")
async def grade_essay(
    ...,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # ... existing grading logic ...
    result = await grading_service.grade(essay_text, rubric_text, grade_level)

    # Auto-save to database
    submission = Submission(
        user_id=user.id,
        essay_text=essay_text,
        rubric_text=rubric_text,
        grade_level=grade_level,
        result=result.model_dump(by_alias=True),  # camelCase JSON
        essay_excerpt=result.essay_excerpt,
        overall_score=result.overall_score,
        max_score=result.max_score,
        category_count=len(result.categories),
        graded_at=datetime.fromisoformat(result.graded_at),
    )
    db.add(submission)
    await db.commit()

    # Update result ID to match saved submission ID
    result.id = str(submission.id)
    return result
```

### Anti-Patterns to Avoid
- **Using `dialects.postgresql.JSONB`:** Breaks SQLite test compatibility. Use `sqlalchemy.JSON` instead.
- **Separate save endpoint:** User decided auto-save; don't add a POST /api/submissions.
- **Returning 403 for other-user resources:** Return 404 to prevent information leakage (user decided).
- **Pagination:** Not needed per user decision (single-user academic project).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UUID generation | Custom ID logic | `uuid.uuid4` via SQLAlchemy default | Already established in User model |
| JSON serialization | Manual dict building | `result.model_dump(by_alias=True)` | Pydantic handles camelCase conversion |
| Auth protection | Custom token parsing | `Depends(get_current_user)` | Already built and tested |
| DB session lifecycle | Manual session management | `Depends(get_db)` | Already built with proper cleanup |

## Common Pitfalls

### Pitfall 1: JSONB vs JSON Column Type
**What goes wrong:** Using `dialects.postgresql.JSONB` causes test failures because SQLite doesn't support JSONB.
**Why it happens:** PostgreSQL has native JSONB, but the test suite uses SQLite via aiosqlite.
**How to avoid:** Use `sqlalchemy.JSON` which works on both PostgreSQL (stored as JSONB) and SQLite (stored as text).
**Warning signs:** `OperationalError` or `CompileError` in tests mentioning JSONB.

### Pitfall 2: Forgetting to Register Model in Alembic env.py
**What goes wrong:** `alembic revision --autogenerate` produces an empty migration.
**Why it happens:** Alembic only detects models imported in `env.py` that inherit from Base.
**How to avoid:** Add `from app.models.submission import Submission  # noqa: F401` in `alembic/env.py`.
**Warning signs:** Empty upgrade/downgrade functions in generated migration.

### Pitfall 3: Forgetting to Export Model in `__init__.py`
**What goes wrong:** `Base.metadata.create_all` in tests doesn't create the submissions table.
**Why it happens:** The test conftest imports `Base` from `app.models.base`, but table registration requires the model module to be imported.
**How to avoid:** Add `Submission` to `app/models/__init__.py` exports.
**Warning signs:** Tests get "no such table: submissions" errors.

### Pitfall 4: camelCase Serialization for JSONB Storage
**What goes wrong:** GradingResult stored in JSONB with snake_case keys, but detail endpoint returns it as-is, mismatching frontend expectations.
**Why it happens:** Pydantic `model_dump()` defaults to snake_case; need `by_alias=True` for camelCase.
**How to avoid:** Always use `result.model_dump(by_alias=True)` when storing GradingResult to JSONB.
**Warning signs:** Frontend receives `essay_text` instead of `essayText`.

### Pitfall 5: Timestamp Timezone Handling
**What goes wrong:** `graded_at` stored without timezone, causing inconsistencies between fresh and retrieved results.
**Why it happens:** `DateTime(timezone=True)` in PostgreSQL stores timezone-aware, but SQLite ignores timezone info.
**How to avoid:** Always use `datetime.fromisoformat()` to parse the ISO string from GradingResult, which already includes UTC timezone. In tests, be flexible about timezone comparison.
**Warning signs:** Timezone-naive datetime warnings or test assertion failures on timestamp equality.

### Pitfall 6: Detail Endpoint Must Return GradingResult Shape, Not Submission Shape
**What goes wrong:** Returning the Submission ORM object or wrapping the JSONB result differently than the original grading response.
**Why it happens:** Mixing up the detail endpoint's return type.
**How to avoid:** The detail endpoint should return the JSONB `result` column directly (it's already in the correct camelCase GradingResult shape). Use `GradingResult.model_validate(submission.result)` or return the dict directly.
**Warning signs:** Frontend gets nested or differently-shaped data from history detail vs fresh grading.

## Code Examples

### Creating Alembic Migration
```bash
# From backend/ directory, with Docker PostgreSQL running
cd backend && alembic revision --autogenerate -m "add submissions table"
```

### Detail Endpoint Pattern
```python
@router.get("/history/{submission_id}")
async def get_history_item(
    submission_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Submission).where(
        Submission.id == uuid.UUID(submission_id),
        Submission.user_id == user.id,
    )
    result = await db.execute(stmt)
    submission = result.scalar_one_or_none()
    if submission is None:
        raise HTTPException(status_code=404, detail="Submission not found")
    return submission.result  # Already camelCase dict from JSONB
```

### Delete Endpoint Pattern
```python
from starlette.responses import Response

@router.delete("/history/{submission_id}", status_code=204)
async def delete_history_item(
    submission_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Submission).where(
        Submission.id == uuid.UUID(submission_id),
        Submission.user_id == user.id,
    )
    result = await db.execute(stmt)
    submission = result.scalar_one_or_none()
    if submission is None:
        raise HTTPException(status_code=404, detail="Submission not found")
    await db.delete(submission)
    await db.commit()
    return Response(status_code=204)
```

### Test Pattern (following test_grading.py)
```python
# Register user, grade essay (with mock LLM), then check history
async def test_history_after_grading(client, patch_llm):
    headers = await _register_and_get_token(client)
    # Grade an essay (auto-saves)
    await client.post("/api/grade", data={"essay_text": "Test essay..."}, headers=headers)
    # Check history
    resp = await client.get("/api/history", headers=headers)
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 1
    assert "essayExcerpt" in items[0]
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SQLAlchemy 1.x declarative_base() | SQLAlchemy 2.0 DeclarativeBase + Mapped[] | SQLAlchemy 2.0 (2023) | Project already uses 2.0 style |
| Sync Alembic | Async Alembic via asyncio.run | Alembic 1.12+ | Project already has async env.py |

## Open Questions

1. **Index on user_id + graded_at (Claude's Discretion)**
   - What we know: user_id is already indexed via ForeignKey. A composite index on (user_id, graded_at DESC) would optimize the history list query.
   - Recommendation: Add the composite index. It's cheap, the query pattern is known, and it follows best practice. Single column index on user_id is sufficient for the FK but the composite covers the ORDER BY.

2. **Auto-save integration point (Claude's Discretion)**
   - What we know: Could modify the route directly or add a persistence method to GradingService.
   - Recommendation: Modify the route directly. The route already has access to the user and db session via dependency injection. Moving persistence into GradingService would require passing db session into the service, breaking its current clean design (it only knows about LLM). Keep the service focused on grading logic and handle persistence at the route level.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest + pytest-asyncio (auto mode) |
| Config file | backend/pyproject.toml `[tool.pytest.ini_options]` |
| Quick run command | `cd backend && python -m pytest tests/test_history.py -x` |
| Full suite command | `cd backend && python -m pytest tests/ -x` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PERSIST-01 | Grading result saved to DB after POST /api/grade | integration | `cd backend && python -m pytest tests/test_grading.py -x -k save` | No - Wave 0 (modify existing test_grading.py) |
| PERSIST-02 | GET /api/history returns user's submissions | integration | `cd backend && python -m pytest tests/test_history.py -x -k list` | No - Wave 0 |
| PERSIST-03 | GET /api/history/:id returns full GradingResult | integration | `cd backend && python -m pytest tests/test_history.py -x -k detail` | No - Wave 0 |
| - | DELETE /api/history/:id removes submission | integration | `cd backend && python -m pytest tests/test_history.py -x -k delete` | No - Wave 0 |
| - | History endpoints return 401 without auth | integration | `cd backend && python -m pytest tests/test_history.py -x -k auth` | No - Wave 0 |
| - | Detail/delete return 404 for other user's submissions | integration | `cd backend && python -m pytest tests/test_history.py -x -k "not_found or other_user"` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `cd backend && python -m pytest tests/test_history.py -x`
- **Per wave merge:** `cd backend && python -m pytest tests/ -x`
- **Phase gate:** Full suite green before /gsd:verify-work

### Wave 0 Gaps
- [ ] `backend/tests/test_history.py` -- covers PERSIST-02, PERSIST-03, delete, auth, ownership checks
- [ ] Update `backend/tests/test_grading.py` -- add test verifying auto-save (PERSIST-01)
- [ ] Ensure Submission model is imported in conftest.py (so `create_all` creates the table)

## Sources

### Primary (HIGH confidence)
- Existing codebase: `backend/app/models/user.py` -- established ORM model pattern
- Existing codebase: `backend/app/routes/auth.py`, `grading.py` -- established route patterns
- Existing codebase: `backend/tests/conftest.py` -- test infrastructure using aiosqlite
- Existing codebase: `backend/app/schemas/history.py` -- HistoryItem already defined
- Existing codebase: `src/api/types.ts` -- frontend type contracts

### Secondary (MEDIUM confidence)
- SQLAlchemy 2.0 docs: `JSON` type works across PostgreSQL and SQLite transparently

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all patterns established in codebase
- Architecture: HIGH -- straightforward CRUD following exact existing patterns
- Pitfalls: HIGH -- identified from direct codebase analysis (JSONB/SQLite, model registration, camelCase)

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable domain, no fast-moving dependencies)
