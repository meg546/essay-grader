---
phase: 19
slug: tiptap-editor-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 19 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None detected — manual browser verification |
| **Config file** | none |
| **Quick run command** | Manual browser smoke test |
| **Full suite command** | Manual verification of all 4 success criteria |
| **Estimated runtime** | ~60 seconds (manual) |

---

## Sampling Rate

- **After every task commit:** Manual browser smoke test
- **After every plan wave:** Manual verification of all 4 success criteria
- **Before `/gsd:verify-work`:** All success criteria must be TRUE
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 19-01-01 | 01 | 1 | EDIT-01 | manual | Browser: editor renders, accepts text | N/A | ⬜ pending |
| 19-01-02 | 01 | 1 | EDIT-01 | manual | Browser: getText() returns plain text | N/A | ⬜ pending |
| 19-01-03 | 01 | 1 | EDIT-01 | manual | Browser: Zustand essayText updates on typing | N/A | ⬜ pending |
| 19-01-04 | 01 | 1 | EDIT-03 | manual | Browser: text size selector changes font | N/A | ⬜ pending |
| 19-01-05 | 01 | 1 | EDIT-01 | manual | Browser: word/char count updates live | N/A | ⬜ pending |
| 19-01-06 | 01 | 1 | EDIT-01 | manual | Browser: submit grading produces identical results | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements — no automated test framework in project. All verification is manual/browser-based.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Editor renders with proper cursor, undo, IME | EDIT-01 | Rich editor behavior requires real browser | Type text, undo with Ctrl+Z, test IME input |
| Text size changes immediately | EDIT-03 | Visual verification | Select small/normal/large, confirm font size changes |
| Word/character count updates live | EDIT-01 | Visual verification | Type text, verify counts update in real-time |
| Submit produces identical grading results | EDIT-01 | End-to-end flow | Submit essay, compare with previous textarea results |

---

## Validation Sign-Off

- [ ] All tasks have manual verify instructions
- [ ] Sampling continuity: every task verified manually in browser
- [ ] No automated test framework required for this phase
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
