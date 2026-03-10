# Phase 15: Frontend Integration - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace all mock API calls with real backend requests. The React frontend uses the real backend for all operations — no mock data remains. Covers auth integration, API client setup, error handling, PDF upload transition, and localStorage migration.

</domain>

<decisions>
## Implementation Decisions

### Auth token handling
- JWT stored in localStorage via existing Zustand profile store (`essay-grader-profile` key)
- Token added as a field in ProfileState alongside existing email, gradeLevel, isSignedIn
- No separate auth store — keep it simple in the existing persist layer
- Profile page has Login + Register tabs (two modes on same page)
- Register calls POST /api/auth/register, then auto-signs in with returned token

### HTTP client
- Shared axios instance in src/api/client.ts with baseURL `http://localhost:8000/api`
- Request interceptor attaches `Authorization: Bearer <token>` from profile store
- Response interceptor handles 401: clear token, set isSignedIn=false, redirect to /profile (silent sign-out, no toast)

### Error display strategy
- 422 validation errors: extract first error message, show as toast.error() (Sonner)
- 500 server errors: generic "Something went wrong. Please try again."
- Network errors (ECONNREFUSED): "Could not reach the server."
- Timeout: "Request timed out. Please try again."
- Error responsibility split: interceptor handles 401 globally; call sites handle 422/500/network with toasts (they have UI context)

### PDF upload transition
- Essay PDFs: keep client-side extraction via unpdf for editable textarea preview. On submit, send essayText string (not the PDF file). User can edit extracted text before grading.
- Rubric PDFs: upload raw PDF file to backend as multipart form data. Backend extracts rubric text with pypdf.
- Keep unpdf dependency for essay text preview
- POST /api/grade uses FormData when rubric file is attached, JSON body otherwise

### localStorage migration
- Bump profile store to version 2 with Zustand persist migrate function
- Migration clears mock-era auth fields (isSignedIn→false, token→null, email→'') but preserves gradeLevel
- Clear local history cache in app store (mock history has no real IDs, useless against backend)
- History now fetched exclusively from GET /api/history

### Claude's Discretion
- Exact axios error parsing utility implementation
- Registration form layout and field validation details
- How to structure the FormData for mixed rubric-file + essay-text submissions
- Whether to remove mock-data.ts and delay.ts files or leave them
- Loading states during API calls

</decisions>

<specifics>
## Specific Ideas

- Frontend already has HistoryItem and GradingResult types in src/api/types.ts — backend responses match exactly
- Mock functions in grading.ts (gradeEssay) and history.ts (getHistory, getHistoryItem) are drop-in replaceable
- Sonner toast system already configured with custom error/success icons in App.tsx
- Backend POST /api/grade accepts both multipart (with files) and JSON body (text only) — frontend should use the appropriate format based on whether a rubric PDF is attached

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- src/components/ui/sonner.tsx: Toast system with custom icons (CircleCheckIcon, OctagonXIcon) — ready for error display
- src/stores/profile-store.ts: Zustand persist store — add token field and real signIn/signOut
- src/stores/app-store.ts: Zustand persist store — clear mock history, fetch from API
- src/lib/pdf-extract.ts: Client-side PDF extraction with unpdf — keep for essay preview
- src/api/types.ts: TypeScript interfaces matching backend Pydantic schemas

### Established Patterns
- Zustand with persist middleware for state management
- Sonner toast.error() / toast.success() for user feedback
- React Router 7 for navigation (redirect to /profile on sign-out)
- File drop/upload in EssayInput.tsx and RubricUpload.tsx components

### Integration Points
- src/api/grading.ts: replace gradeEssay() mock with real POST /api/grade
- src/api/history.ts: replace getHistory() and getHistoryItem() with real GET calls
- src/stores/profile-store.ts: replace mock signIn with POST /api/auth/login
- src/pages/ProfilePage.tsx: add registration form tab
- src/pages/GradingPage.tsx: update error handling for real API errors
- src/components/grading/RubricUpload.tsx: change from extract-then-store to upload-file-on-submit
- package.json: add axios dependency

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 15-frontend-integration*
*Context gathered: 2026-03-09*
