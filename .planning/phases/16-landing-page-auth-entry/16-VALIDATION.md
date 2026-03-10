---
phase: 16
slug: landing-page-auth-entry
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright ^1.58.2 |
| **Config file** | Needs investigation (Wave 0 verifies) |
| **Quick run command** | `npx playwright test --grep "landing"` |
| **Full suite command** | `npx playwright test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx playwright test --grep "landing"`
- **After every plan wave:** Run `npx playwright test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 16-01-01 | 01 | 1 | LAND-01 | smoke | `npx playwright test tests/landing.spec.ts -x` | ❌ W0 | ⬜ pending |
| 16-01-02 | 01 | 1 | LAND-02 | smoke | `npx playwright test tests/landing.spec.ts -x` | ❌ W0 | ⬜ pending |
| 16-01-03 | 01 | 1 | LAND-03 | integration | `npx playwright test tests/auth-routing.spec.ts -x` | ❌ W0 | ⬜ pending |
| 16-02-01 | 02 | 1 | AUTH2-01 | integration | `npx playwright test tests/auth-routing.spec.ts -x` | ❌ W0 | ⬜ pending |
| 16-02-02 | 02 | 1 | AUTH2-02 | smoke | `npx playwright test tests/landing.spec.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Playwright test config — verify setup exists and works
- [ ] `tests/landing.spec.ts` — landing page content and button tests (LAND-01, LAND-02, AUTH2-02)
- [ ] `tests/auth-routing.spec.ts` — auth redirect and protected route tests (LAND-03, AUTH2-01)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Animated walkthrough demo | LAND-01 | Visual animation quality | Visit landing page, confirm walkthrough auto-plays and shows grading flow |
| No landing page flash for auth users | LAND-03 | Timing-sensitive redirect | Sign in, navigate to /, confirm instant redirect without content flash |
| Dark mode support | LAND-01 | Visual consistency | Toggle dark mode, verify landing page renders correctly |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
