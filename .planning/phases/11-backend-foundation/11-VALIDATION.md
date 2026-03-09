---
phase: 11
slug: backend-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest + httpx (AsyncClient) |
| **Config file** | backend/pyproject.toml `[tool.pytest.ini_options]` (Wave 0) |
| **Quick run command** | `cd backend && uv run pytest tests/ -x -q` |
| **Full suite command** | `cd backend && uv run pytest tests/ -v` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && uv run pytest tests/ -x -q`
- **After every plan wave:** Run `cd backend && uv run pytest tests/ -v`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | 01 | 1 | INFRA-01 | smoke | `cd backend && uv run pytest tests/test_health.py -x` | ❌ W0 | ⬜ pending |
| TBD | 01 | 1 | INFRA-03 | unit | `cd backend && uv run pytest tests/test_cors.py -x` | ❌ W0 | ⬜ pending |
| TBD | 01 | 1 | INFRA-04 | unit | `cd backend && uv run pytest tests/test_schemas.py -x` | ❌ W0 | ⬜ pending |
| TBD | 02 | 1 | INFRA-02 | manual | `docker compose up -d && docker compose ps` | manual-only | ⬜ pending |
| TBD | 02 | 1 | INFRA-05 | integration | `cd backend && uv run alembic upgrade head` | manual-only | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/tests/__init__.py` — test package
- [ ] `backend/tests/conftest.py` — shared fixtures (async client, test app)
- [ ] `backend/tests/test_health.py` — covers INFRA-01
- [ ] `backend/tests/test_cors.py` — covers INFRA-03
- [ ] `backend/tests/test_schemas.py` — covers INFRA-04
- [ ] Dev dependency: `uv add --dev pytest pytest-asyncio httpx`
- [ ] `backend/pyproject.toml` needs `[tool.pytest.ini_options]` with `asyncio_mode = "auto"`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Docker Compose starts both services healthy | INFRA-02 | Requires Docker daemon running | `docker compose up -d && docker compose ps` — verify both services show "healthy" |
| Alembic applies migrations | INFRA-05 | Requires running PostgreSQL | `cd backend && uv run alembic upgrade head` — verify no errors |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
