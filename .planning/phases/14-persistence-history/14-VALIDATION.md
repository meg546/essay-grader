---
phase: 14
slug: persistence-history
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest + pytest-asyncio (auto mode) |
| **Config file** | backend/pyproject.toml `[tool.pytest.ini_options]` |
| **Quick run command** | `cd backend && python -m pytest tests/test_history.py -x` |
| **Full suite command** | `cd backend && python -m pytest tests/ -x` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && python -m pytest tests/test_history.py -x`
- **After every plan wave:** Run `cd backend && python -m pytest tests/ -x`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | PERSIST-01 | integration | `cd backend && python -m pytest tests/test_grading.py -x -k save` | ❌ W0 | ⬜ pending |
| 14-01-02 | 01 | 1 | PERSIST-02 | integration | `cd backend && python -m pytest tests/test_history.py -x -k list` | ❌ W0 | ⬜ pending |
| 14-01-03 | 01 | 1 | PERSIST-03 | integration | `cd backend && python -m pytest tests/test_history.py -x -k detail` | ❌ W0 | ⬜ pending |
| 14-01-04 | 01 | 1 | - | integration | `cd backend && python -m pytest tests/test_history.py -x -k delete` | ❌ W0 | ⬜ pending |
| 14-01-05 | 01 | 1 | - | integration | `cd backend && python -m pytest tests/test_history.py -x -k auth` | ❌ W0 | ⬜ pending |
| 14-01-06 | 01 | 1 | - | integration | `cd backend && python -m pytest tests/test_history.py -x -k "not_found or other_user"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/tests/test_history.py` — stubs for PERSIST-02, PERSIST-03, delete, auth, ownership checks
- [ ] Update `backend/tests/test_grading.py` — add test verifying auto-save (PERSIST-01)
- [ ] Ensure Submission model is imported in conftest.py (so `create_all` creates the table)

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
