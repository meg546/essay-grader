---
phase: 8
slug: collapsible-hero-grading-workspace
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-08
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (if installed) or manual verification |
| **Config file** | none — primarily visual/interaction behavior |
| **Quick run command** | `npx tsc --noEmit && npm run build` |
| **Full suite command** | `npx tsc --noEmit && npm run build` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit && npm run build`
- **After every plan wave:** Run `npx tsc --noEmit && npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | LAYOUT-01 | build + type-check | `npx tsc --noEmit && npm run build` | ✅ | ⬜ pending |
| 08-01-02 | 01 | 1 | LAYOUT-02 | build + type-check | `npx tsc --noEmit && npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Hero visible with title + tagline on fresh load | LAYOUT-01 | Visual layout verification | Load / in browser, verify hero section visible with centered title and tagline |
| Hero collapses on textarea focus | LAYOUT-02 | Interaction + animation behavior | Click essay textarea, verify hero slides up smoothly (~300ms) |
| Hero stays collapsed while working | LAYOUT-02 | State persistence during interaction | Type in textarea, upload rubric, verify hero remains hidden |
| Hero re-appears after reset | LAYOUT-02 | State reset behavior | Click "Grade Another", verify hero slides back down |
| Hero starts collapsed with existing text | LAYOUT-02 | Persisted state behavior | Set essay text in store, reload page, verify hero not shown |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
