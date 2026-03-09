---
phase: 13
slug: llm-inference-grading
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 7.x + pytest-asyncio (already configured) |
| **Config file** | backend/pyproject.toml (asyncio_mode = "auto") |
| **Quick run command** | `cd backend && python -m pytest tests/test_grading.py tests/test_highlights.py tests/test_pdf.py tests/test_llm_client.py -x` |
| **Full suite command** | `cd backend && python -m pytest tests/ -x` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && python -m pytest tests/test_grading.py tests/test_highlights.py tests/test_pdf.py tests/test_llm_client.py -x`
- **After every plan wave:** Run `cd backend && python -m pytest tests/ -x`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | GRADE-04 | unit | `pytest tests/test_llm_client.py::test_provider_factory -x` | ❌ W0 | ⬜ pending |
| 13-01-02 | 01 | 1 | GRADE-01 | integration | `pytest tests/test_grading.py::test_grade_essay_returns_full_result -x` | ❌ W0 | ⬜ pending |
| 13-02-01 | 02 | 1 | GRADE-02 | unit | `pytest tests/test_highlights.py::test_highlight_offset_computation -x` | ❌ W0 | ⬜ pending |
| 13-02-02 | 02 | 1 | PDF-01 | unit | `pytest tests/test_pdf.py::test_extract_pdf_text -x` | ❌ W0 | ⬜ pending |
| 13-02-03 | 02 | 1 | PDF-02 | integration | `pytest tests/test_grading.py::test_grade_with_pdf_upload -x` | ❌ W0 | ⬜ pending |
| 13-03-01 | 03 | 2 | GRADE-03 | integration | `pytest tests/test_grading.py::test_grade_level_affects_prompt -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/test_grading.py` — integration tests for POST /api/grade with mocked LLM client
- [ ] `tests/test_highlights.py` — unit tests for quote-to-offset matching logic
- [ ] `tests/test_pdf.py` — unit tests for PDF text extraction (with sample PDF fixture)
- [ ] `tests/test_llm_client.py` — unit tests for provider factory and client initialization
- [ ] `tests/conftest.py` — add fixtures for mocked LLM client, sample essay text, sample PDF bytes

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Grading produces noticeably different scoring at different grade levels | GRADE-03 | Requires subjective review of LLM output quality | Submit same essay at grade 5 and grade 12; verify rubric expectations and scoring differ meaningfully |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
