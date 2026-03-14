---
phase: 21
slug: llm-powered-suggestion-popover
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 21 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest + pytest-asyncio 9.x |
| **Config file** | `backend/pyproject.toml` (`asyncio_mode = "auto"`) |
| **Quick run command** | `cd backend && uv run pytest tests/test_suggestions.py -x` |
| **Full suite command** | `cd backend && uv run pytest tests/ -x` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && uv run pytest tests/test_suggestions.py -x`
- **After every plan wave:** Run `cd backend && uv run pytest tests/ -x`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 21-01-01 | 01 | 1 | GRAM-02 | integration | `cd backend && uv run pytest tests/test_suggestions.py::test_suggestions_returns_message_and_suggestions -x` | ❌ W0 | ⬜ pending |
| 21-01-02 | 01 | 1 | GRAM-02 | integration | `cd backend && uv run pytest tests/test_suggestions.py::test_suggestions_requires_auth -x` | ❌ W0 | ⬜ pending |
| 21-01-03 | 01 | 1 | GRAM-02 | unit | `cd backend && uv run pytest tests/test_suggestions.py::test_suggestions_handles_bad_llm_json -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/tests/test_suggestions.py` — stubs for GRAM-02
- [ ] Fixtures for mocking `OllamaClient.complete` via `unittest.mock.AsyncMock`

*Existing conftest.py infrastructure covers auth fixtures and async client.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Popover shows loading spinner then LLM suggestions on click | GRAM-02 | Visual UI interaction | Click underlined word, verify spinner appears, then LLM message + suggestions render |
| Popover stays within viewport near editor edges | GRAM-02 | Visual layout | Scroll to bottom of essay, click underline near edge, verify popover stays visible |
| Clicking suggestion replaces text and closes popover | GRAM-02 | E2E interaction | Click suggestion in popover, verify text replaced in editor |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
