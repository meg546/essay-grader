---
status: complete
phase: 15-frontend-integration
source: [15-01-SUMMARY.md, 15-02-SUMMARY.md]
started: 2026-03-10T01:15:00Z
updated: 2026-03-10T02:07:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Register a New Account
expected: On the Profile page, you see Login and Register tabs. Switch to Register tab. Enter an email and password (minimum 8 characters). Submit. You are automatically signed in — the page shows your profile/signed-in state without needing a separate login step.
result: pass

### 2. Login with Existing Account
expected: Sign out if signed in. On the Login tab, enter the credentials you just registered with. Submit. You are signed in and the page reflects your authenticated state.
result: pass

### 3. Grade an Essay (Real Backend)
expected: While signed in, go to the Grading page. Enter essay text, select a grade level, optionally attach a rubric file. Submit. After a loading period (may take 30-120 seconds due to LLM inference), you receive grading results with scores and feedback — not mock data.
result: issue
reported: "Grading works (scores and feedback appear) but text highlights do not render — essay is plain text with no colored marks. Backend returns highlights with valid offsets via curl, but the LLM flat-format response normalization may not preserve the quotes field needed by compute_highlights for long essays."
severity: major

### 4. Error Handling on Invalid Input
expected: Try submitting a grading request that will fail (e.g., empty essay text, or sign out and try to grade). You see a user-friendly error toast message — not a raw error object or silent failure.
result: pass

### 5. View Submission History
expected: After grading at least one essay, go to the Profile page. Your past submissions are listed, fetched from the backend API — not from localStorage mock data. Clicking a history item shows its details.
result: pass

### 6. Auth Token Persistence Across Refresh
expected: While signed in, refresh the page (Cmd+R or F5). You remain signed in — the JWT token persists in localStorage via Zustand and is automatically attached to subsequent API requests.
result: pass

### 7. 401 Auto Sign-Out
expected: If your token becomes invalid (e.g., manually clear/corrupt the token in localStorage devtools, then trigger an API call), you are automatically signed out and redirected to the login screen — no toast, silent sign-out.
result: pass

### 8. localStorage Migration from Mock Era
expected: If you had old mock-era localStorage data (from before the backend integration), it is automatically cleared on first load. You are not stuck in a broken auth state — you see a clean login screen.
result: pass

## Summary

total: 8
passed: 7
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Grading results show colored text highlights on the essay"
  status: failed
  reason: "User reported: highlights do not render — essay displays as plain text with no colored marks despite backend returning valid highlight offsets"
  severity: major
  test: 3
  root_cause: "LLM flat-format response (categories as object keys) may lose quotes field during normalization, or LLM produces empty quotes for long essays"
  artifacts:
    - path: "backend/app/services/grading.py"
      issue: "Normalization of flat LLM format may not preserve quotes array"
    - path: "backend/app/llm/highlights.py"
      issue: "compute_highlights depends on quotes field being present"
  missing:
    - "Verify quotes field passes through normalization for flat format"
    - "Add fallback: if no quotes, skip highlights gracefully"
