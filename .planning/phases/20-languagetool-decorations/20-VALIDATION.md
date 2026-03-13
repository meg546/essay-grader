---
phase: 20
slug: languagetool-decorations
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 20 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 9.0+ (backend) |
| **Config file** | `backend/pyproject.toml` — `[tool.pytest.ini_options]` with `asyncio_mode = "auto"` |
| **Quick run command** | `cd backend && python -m pytest tests/test_languagetool.py -x` |
| **Full suite command** | `cd backend && python -m pytest` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && python -m pytest tests/test_languagetool.py -x`
- **After every plan wave:** Run `cd backend && python -m pytest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 20-01-01 | 01 | 1 | GRAM-01 | unit | `cd backend && python -m pytest tests/test_languagetool.py -x` | ❌ W0 | ⬜ pending |
| 20-01-02 | 01 | 1 | GRAM-01 | manual | — | manual-only | ⬜ pending |
| 20-01-03 | 01 | 1 | GRAM-01 | manual | — | manual-only | ⬜ pending |
| 20-01-04 | 01 | 1 | GRAM-01 | manual | — | manual-only | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/tests/test_languagetool.py` — stubs for GRAM-01 proxy route and 429 handling

*Frontend offset mapping validated manually via browser console (no frontend test runner exists).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Decorations appear within 4s after typing stops | GRAM-01 | Browser-only timing, no frontend test runner | Type text in editor, stop, observe underlines appear within 4s |
| Underlines highlight exact word/phrase | GRAM-01 | Visual verification needed | Type known misspelling, verify underline spans correct characters |
| Decorations clear on typing and re-check | GRAM-01 | Browser interaction behavior | Start typing after underlines appear, verify they clear in touched paragraph |
| 429 rate-limit retry with existing underlines preserved | GRAM-01 | Requires network throttling | Simulate 429 via DevTools, verify underlines remain and retry occurs |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
