---
phase: 17
slug: registration-wizard
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright ^1.58.2 |
| **Config file** | needs investigation (playwright config may exist) |
| **Quick run command** | `npx playwright test --grep "wizard"` |
| **Full suite command** | `npx playwright test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Manual browser testing (wizard is highly visual)
- **After every plan wave:** Run `npx playwright test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 17-01-01 | 01 | 1 | ONBD-01 | e2e | `npx playwright test tests/onboarding.spec.ts` | ❌ W0 | ⬜ pending |
| 17-01-02 | 01 | 1 | ONBD-02 | e2e | `npx playwright test tests/onboarding.spec.ts --grep "skip"` | ❌ W0 | ⬜ pending |
| 17-01-03 | 01 | 1 | ONBD-03 | e2e | `npx playwright test tests/onboarding.spec.ts --grep "grade"` | ❌ W0 | ⬜ pending |
| 17-01-04 | 01 | 1 | ONBD-04 | e2e | `npx playwright test tests/onboarding.spec.ts --grep "redirect"` | ❌ W0 | ⬜ pending |
| 17-BE-01 | 01 | 1 | ONBD-04 | unit | `cd backend && python -m pytest tests/test_auth_me.py` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/onboarding.spec.ts` — e2e stubs for ONBD-01 through ONBD-04
- [ ] `backend/tests/test_auth_me.py` — unit test for PATCH /api/auth/me endpoint
- [ ] Verify Playwright config exists and is functional

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Slide animation quality & timing | ONBD-01 | Visual quality cannot be asserted programmatically | Verify smooth left/right transitions between wizard steps |
| Responsive layout on mobile | ONBD-01 | Visual responsive design check | Test wizard on viewport widths 375px, 768px, 1024px |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
