---
phase: 9
slug: side-by-side-results-highlighting
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-08
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — no test framework configured |
| **Config file** | none |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build` + visual inspection
- **Before `/gsd:verify-work`:** Full build must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | LAYOUT-03 | build | `npm run build` | ✅ | ⬜ pending |
| 09-01-02 | 01 | 1 | LAYOUT-04 | build | `npm run build` | ✅ | ⬜ pending |
| 09-02-01 | 02 | 1 | HLGT-02 | build | `npm run build` | ✅ | ⬜ pending |
| 09-02-02 | 02 | 1 | HLGT-03 | build | `npm run build` | ✅ | ⬜ pending |
| 09-03-01 | 03 | 1 | HLGT-04, HLGT-05 | build | `npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. No test framework installation needed — all requirements are visual/interactive and verified manually.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Side-by-side layout at >1024px | LAYOUT-03 | Visual CSS Grid layout | Open in browser >1024px, verify essay left / feedback right |
| Stacked layout at <1024px | LAYOUT-04 | Responsive breakpoint | Use devtools responsive mode <1024px, verify single column |
| Color-coded essay passages | HLGT-02 | Visual rendering | After grading, verify colored marks on essay text |
| Click card scrolls to highlight | HLGT-03 | Scroll interaction | Click each category card, verify essay scrolls to highlight |
| Color legend with toggles | HLGT-04 | Visual + interaction | Click legend toggles, verify highlights show/hide per category |
| Hover pulses highlight | HLGT-05 | Hover animation | Hover card → verify highlight pulses; hover highlight → verify card indicates |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
