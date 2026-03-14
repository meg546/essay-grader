---
phase: 23
slug: writing-timer-file-upload
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 23 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 7.x (backend), no frontend test framework |
| **Config file** | backend/pyproject.toml |
| **Quick run command** | `cd backend && python -m pytest tests/ -x -q` |
| **Full suite command** | `cd backend && python -m pytest tests/ -q` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && python -m pytest tests/ -x -q`
- **After every plan wave:** Run `cd backend && python -m pytest tests/ -q` + `npx tsc --noEmit`
- **Before `/gsd:verify-work`:** Full suite must be green + TypeScript compiles
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 23-01-01 | 01 | 1 | TOOL-02 | unit | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 23-01-02 | 01 | 1 | TOOL-02 | manual | Manual browser verification | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test framework needed — this phase is frontend-only (no new backend code). TypeScript compilation (`npx tsc --noEmit`) serves as automated validation for type correctness.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Timer starts and displays countdown | TOOL-02 | UI interaction — no frontend test framework | Click Timer icon, select 1min preset, click Start, verify countdown appears in bottom panel |
| Timer expires with toast | TOOL-02 | UI timing behavior | Set 1min timer, wait for expiry, verify toast appears and timer clears |
| Preset buttons scroll picker | TOOL-02 | Scroll-snap CSS behavior | Click each preset, verify picker scrolls to correct value |
| Timer pauses on navigation | TOOL-02 | Route-change behavior | Start timer, navigate to /history, return to /grade, verify timer resumed |
| Timer persists on reload | TOOL-02 | Zustand persist behavior | Start timer, reload page, verify timer resumes |
| Timer cancels on submit | TOOL-02 | Grading flow interaction | Start timer, submit essay, verify timer is gone after grading |
| File upload already works | EDIT-02 | Already implemented | Verify EssayUploadModal and drag-drop still work |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
