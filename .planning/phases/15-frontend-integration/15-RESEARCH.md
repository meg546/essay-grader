# Phase 15: Frontend Integration - Research

**Researched:** 2026-03-09
**Domain:** React frontend API integration (axios, Zustand persist migration, error handling)
**Confidence:** HIGH

## Summary

Phase 15 replaces all mock API calls in the React frontend with real axios requests to the FastAPI backend. The codebase is well-structured for this transition: mock functions in `src/api/grading.ts` and `src/api/history.ts` are thin wrappers returning fake data, and the TypeScript interfaces in `src/api/types.ts` already match the backend's Pydantic schemas (with camelCase alias generation via `CamelModel`). The Zustand profile store needs a token field, version bump to 2, and a migrate function to handle localStorage from the mock era.

The backend uses Form fields (not JSON body) for the grading endpoint -- this is a critical detail. `POST /api/grade` expects `essay_text`, `rubric_text`, `grade_level` as form fields and optional `rubric_file` as an upload. This means the frontend should always use FormData for the grading endpoint, not conditionally. Auth endpoints (`/api/auth/login`, `/api/auth/register`) use standard JSON bodies. History endpoints return JSON with camelCase keys.

**Primary recommendation:** Use axios with a shared instance, request interceptor for auth, response interceptor for 401 handling, and FormData for all grading submissions.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- JWT stored in localStorage via existing Zustand profile store (`essay-grader-profile` key)
- Token added as a field in ProfileState alongside existing email, gradeLevel, isSignedIn
- No separate auth store -- keep it simple in the existing persist layer
- Profile page has Login + Register tabs (two modes on same page)
- Register calls POST /api/auth/register, then auto-signs in with returned token
- Shared axios instance in src/api/client.ts with baseURL `http://localhost:8000/api`
- Request interceptor attaches `Authorization: Bearer <token>` from profile store
- Response interceptor handles 401: clear token, set isSignedIn=false, redirect to /profile (silent sign-out, no toast)
- 422 validation errors: extract first error message, show as toast.error() (Sonner)
- 500 server errors: generic "Something went wrong. Please try again."
- Network errors (ECONNREFUSED): "Could not reach the server."
- Timeout: "Request timed out. Please try again."
- Error responsibility split: interceptor handles 401 globally; call sites handle 422/500/network with toasts
- Essay PDFs: keep client-side extraction via unpdf for editable textarea preview. On submit, send essayText string (not the PDF file)
- Rubric PDFs: upload raw PDF file to backend as multipart form data. Backend extracts rubric text with pypdf
- Keep unpdf dependency for essay text preview
- POST /api/grade uses FormData when rubric file is attached, JSON body otherwise
- Bump profile store to version 2 with Zustand persist migrate function
- Migration clears mock-era auth fields (isSignedIn->false, token->null, email->'') but preserves gradeLevel
- Clear local history cache in app store (mock history has no real IDs, useless against backend)
- History now fetched exclusively from GET /api/history

### Claude's Discretion
- Exact axios error parsing utility implementation
- Registration form layout and field validation details
- How to structure the FormData for mixed rubric-file + essay-text submissions
- Whether to remove mock-data.ts and delay.ts files or leave them
- Loading states during API calls

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FRONT-01 | Mock API function bodies replaced with real Axios calls to backend | Axios client setup, FormData for grading endpoint, JSON for auth/history endpoints; exact backend route signatures documented |
| FRONT-02 | Axios interceptor adds Authorization Bearer header and handles 401 auto-signout | Request interceptor reads token from Zustand store; response interceptor checks 401, clears state, redirects to /profile |
| FRONT-03 | Frontend handles error responses gracefully (401, 422, 500) | Error parsing utility extracts FastAPI error detail format; call-site toast patterns documented |
| FRONT-04 | localStorage state migrated from mock auth era (clear/version persist key) | Zustand persist migrate function with version bump; app store history cleared |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| axios | ^1.7 | HTTP client | Interceptors, automatic JSON transform, FormData support, timeout config |
| zustand | ^5.0.11 | State management | Already in project; persist middleware has built-in version/migrate support |
| sonner | ^2.0.7 | Toast notifications | Already in project; toast.error() for user-facing error messages |
| react-router | ^7.13.1 | Navigation | Already in project; useNavigate for redirect on 401 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| unpdf | ^1.4.0 | Client-side PDF text extraction | Essay PDF preview only (already in project) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| axios | fetch API | fetch is built-in but lacks interceptors, automatic JSON transform, and timeout -- axios is simpler for this use case |

**Installation:**
```bash
npm install axios
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── api/
│   ├── client.ts          # Shared axios instance with interceptors
│   ├── auth.ts            # NEW: login(), register() functions
│   ├── grading.ts         # MODIFIED: replace mock with real POST /api/grade
│   ├── history.ts         # MODIFIED: replace mock with real GET /api/history
│   ├── errors.ts          # NEW: error parsing utility
│   └── types.ts           # KEEP: already matches backend schemas
├── stores/
│   ├── profile-store.ts   # MODIFIED: add token, version 2 migration, real signIn/signOut
│   └── app-store.ts       # MODIFIED: remove local history persistence, add version migration
├── pages/
│   ├── ProfilePage.tsx    # MODIFIED: add Register tab, use real auth
│   └── GradingPage.tsx    # MODIFIED: update error handling, FormData submission
└── components/
    └── grading/
        └── RubricUpload.tsx  # MODIFIED: stop extracting text, keep file reference for upload
```

### Pattern 1: Axios Client with Interceptors
**What:** Centralized axios instance with auth header injection and 401 handling
**When to use:** Every API call goes through this client
**Example:**
```typescript
// src/api/client.ts
import axios from "axios";
import { useProfileStore } from "@/stores/profile-store";

export const apiClient = axios.create({
  baseURL: "http://localhost:8000/api",
  timeout: 60_000, // grading can take time with LLM inference
});

// Request interceptor: attach token
apiClient.interceptors.request.use((config) => {
  const token = useProfileStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      useProfileStore.getState().signOut();
      window.location.href = "/profile";
    }
    return Promise.reject(error);
  }
);
```

### Pattern 2: Error Parsing Utility
**What:** Extract user-friendly messages from axios errors
**When to use:** Call sites catch errors and show toasts
**Example:**
```typescript
// src/api/errors.ts
import axios from "axios";

export function getErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return "Something went wrong. Please try again.";
  }
  if (error.code === "ECONNABORTED") {
    return "Request timed out. Please try again.";
  }
  if (!error.response) {
    return "Could not reach the server.";
  }
  if (error.response.status === 422) {
    // FastAPI returns { detail: string | Array<{msg: string, ...}> }
    const detail = error.response.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length > 0) return detail[0].msg;
    return "Invalid input. Please check your data.";
  }
  // 500, 502, 503, etc.
  return "Something went wrong. Please try again.";
}
```

### Pattern 3: FormData for Grading Endpoint
**What:** Build FormData for POST /api/grade since backend uses Form() fields
**When to use:** Grading submission
**Example:**
```typescript
// src/api/grading.ts
import { apiClient } from "./client";
import type { GradingResult } from "./types";

export async function gradeEssay(
  essayText: string,
  gradeLevel: string,
  rubricFile?: File | null,
  rubricText?: string,
): Promise<GradingResult> {
  const formData = new FormData();
  formData.append("essay_text", essayText);
  formData.append("grade_level", gradeLevel);
  if (rubricFile) {
    formData.append("rubric_file", rubricFile);
  } else if (rubricText) {
    formData.append("rubric_text", rubricText);
  }
  const { data } = await apiClient.post<GradingResult>("/grade", formData);
  return data;
}
```

### Pattern 4: Zustand Persist Migration
**What:** Version bump with migrate function to clear stale mock data
**When to use:** Profile store and app store upgrades
**Example:**
```typescript
// Profile store migration
persist(
  (set) => ({ /* ... */ }),
  {
    name: "essay-grader-profile",
    version: 2,
    migrate: (persistedState: unknown, version: number) => {
      const state = persistedState as Record<string, unknown>;
      if (version < 2) {
        // Clear mock-era auth fields, preserve gradeLevel
        return {
          ...state,
          isSignedIn: false,
          token: null,
          email: "",
        };
      }
      return state;
    },
    partialize: (state) => ({
      email: state.email,
      gradeLevel: state.gradeLevel,
      isSignedIn: state.isSignedIn,
      token: state.token,
    }),
  }
)
```

### Anti-Patterns to Avoid
- **Conditional JSON vs FormData for grading:** The backend grading route uses `Form()` parameters, so always use FormData -- not JSON. Even if there is no rubric file, form fields are required by the route signature.
- **Storing full GradingResult in app store history:** History should come from the backend now. Do not persist grading results locally; fetch via GET /api/history.
- **Using `useNavigate()` inside interceptor:** Interceptors run outside React component tree. Use `window.location.href` for redirect in the 401 interceptor, not React Router hooks.
- **Calling `signOut()` in interceptor AND showing toast:** The decision is silent sign-out on 401. No toast in the interceptor.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP client with auth | Custom fetch wrapper | axios with interceptors | Interceptors handle token injection and 401 globally |
| Error message extraction | Switch/case per component | Shared `getErrorMessage()` utility | FastAPI has consistent error format; centralize parsing |
| State persistence migration | Manual localStorage manipulation | Zustand persist `migrate` + `version` | Built-in, handles version tracking automatically |
| Form multipart encoding | Manual boundary construction | `new FormData()` + axios | axios auto-sets Content-Type with boundary for FormData |

**Key insight:** The mock API layer was designed to be replaceable. The function signatures in grading.ts and history.ts are nearly identical to what the real API calls need -- the primary change is swapping the implementation body.

## Common Pitfalls

### Pitfall 1: Backend Uses Form Fields, Not JSON Body for Grading
**What goes wrong:** Sending JSON to POST /api/grade returns 422 because the route expects Form() parameters
**Why it happens:** Most endpoints use JSON, but grading uses Form() to support file uploads alongside text fields
**How to avoid:** Always use FormData for the grading endpoint. Axios auto-sets `Content-Type: multipart/form-data` when given FormData.
**Warning signs:** 422 "field required" errors on essay_text when testing grading

### Pitfall 2: Zustand getState() in Interceptor
**What goes wrong:** Interceptor can't access token because it uses React hook syntax
**Why it happens:** Interceptors run outside React component tree
**How to avoid:** Use `useProfileStore.getState()` (vanilla access) not `useProfileStore()` (hook). Zustand supports both.
**Warning signs:** "Invalid hook call" error or undefined token

### Pitfall 3: 401 Redirect Loop
**What goes wrong:** 401 handler redirects to /profile, but /profile itself makes an API call that also 401s, causing infinite redirect
**Why it happens:** The /profile page may call GET /api/auth/me on mount while the token is being cleared
**How to avoid:** The 401 interceptor should clear state and redirect. Profile page should NOT make API calls when not signed in (check isSignedIn first).
**Warning signs:** Browser shows "too many redirects" or flickering pages

### Pitfall 4: Stale localStorage Breaks New Auth Flow
**What goes wrong:** User has `isSignedIn: true` from mock era but no real JWT token. Frontend thinks user is authenticated, makes API calls, gets 401
**Why it happens:** localStorage persists across deploys; old state has no token field
**How to avoid:** Zustand persist version bump from undefined/1 to 2, with migrate function that resets auth fields
**Warning signs:** Existing users immediately see sign-out redirect on first load

### Pitfall 5: RubricUpload Extracts Text Client-Side (Old Behavior)
**What goes wrong:** Rubric text is extracted client-side and sent as text, but backend should receive the raw PDF
**Why it happens:** Current RubricUpload.tsx calls extractTextFromPdf() on file selection
**How to avoid:** Remove client-side rubric extraction. Keep the File reference and send it as FormData to backend. Backend uses pypdf for extraction.
**Warning signs:** Rubric text extraction fails on image-based PDFs (backend pypdf handles differently than client unpdf)

### Pitfall 6: Grading Timeout
**What goes wrong:** LLM inference can take 30-60+ seconds, default axios timeout (0 or short) causes premature timeout
**Why it happens:** LLM grading pipeline does two passes through the model
**How to avoid:** Set generous timeout on the axios instance (60-120 seconds) or per-request override for grading endpoint
**Warning signs:** "Request timed out" errors during grading with working backend

### Pitfall 7: Password Minimum Length Mismatch
**What goes wrong:** Frontend validates password >= 6 chars but backend requires >= 8 chars
**Why it happens:** Mock-era frontend validation used 6, backend RegisterRequest uses `Field(min_length=8)`
**How to avoid:** Update frontend validation to match backend's 8-character minimum
**Warning signs:** 422 errors on registration despite frontend validation passing

## Code Examples

### Auth API Functions
```typescript
// src/api/auth.ts
import { apiClient } from "./client";

interface TokenResponse {
  access_token: string;
  token_type: string;
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>("/auth/login", { email, password });
  return data;
}

export async function register(email: string, password: string): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>("/auth/register", { email, password });
  return data;
}
```

### History API Functions
```typescript
// src/api/history.ts
import { apiClient } from "./client";
import type { GradingResult, HistoryItem } from "./types";

export async function getHistory(): Promise<HistoryItem[]> {
  const { data } = await apiClient.get<HistoryItem[]>("/history");
  return data;
}

export async function getHistoryItem(id: string): Promise<GradingResult> {
  const { data } = await apiClient.get<GradingResult>(`/history/${id}`);
  return data;
}
```

### Profile Store with Token and Migration
```typescript
// Key additions to profile-store.ts
interface ProfileState {
  email: string;
  gradeLevel: GradeLevel;
  isSignedIn: boolean;
  isSigningIn: boolean;
  token: string | null;  // NEW
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;  // NEW
  signOut: () => void;
  setGradeLevel: (level: GradeLevel) => void;
}
```

### GradingPage Submit with FormData and Error Handling
```typescript
// Updated handleSubmit in GradingPage.tsx
async function handleSubmit() {
  setIsGrading(true);
  try {
    const rubricFile = useAppStore.getState().rubricFile;
    const result = await gradeEssay(essayText, gradeLevel, rubricFile);
    setCurrentResult(result);
    // No local addToHistory -- backend auto-saves, history fetched from API
  } catch (error) {
    toast.error(getErrorMessage(error));
  } finally {
    setIsGrading(false);
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Mock delay + fake data | Real axios calls to FastAPI | Phase 15 (now) | Full end-to-end functionality |
| Client-side rubric extraction | Backend pypdf extraction | Phase 15 (now) | Better PDF support, handles image PDFs |
| Local history in Zustand | Server-side history via API | Phase 15 (now) | Persistent across devices, tied to user account |
| Mock auth (any email works) | JWT auth with real registration | Phase 15 (now) | Real user accounts, secure token-based auth |

**Deprecated/outdated:**
- `src/api/delay.ts`: No longer needed (remove)
- `src/api/mock-data.ts`: No longer needed (remove)
- Client-side rubric text extraction in RubricUpload: Replace with file-pass-through to backend

## Open Questions

1. **Grading endpoint always uses Form fields**
   - What we know: Backend route uses `Form()` for all parameters, even text-only submissions
   - What's unclear: The CONTEXT.md says "FormData when rubric file is attached, JSON body otherwise" but backend always expects Form fields
   - Recommendation: Always use FormData. Sending JSON to a Form() endpoint will 422. This overrides the CONTEXT.md conditional approach.

2. **History detail returns raw JSONB dict**
   - What we know: `GET /api/history/:id` returns `submission.result` which is the raw JSONB column (already camelCase dict)
   - What's unclear: Whether the response exactly matches the GradingResult TypeScript interface (it should since it was stored via `model_dump(by_alias=True)`)
   - Recommendation: Type as GradingResult, verify with manual testing

3. **409 Conflict on duplicate registration**
   - What we know: Backend returns 409 when email already registered
   - What's unclear: Not covered in the error display strategy (only 422, 500, network mentioned)
   - Recommendation: Handle 409 in the register function, show "Email already registered" toast

## Sources

### Primary (HIGH confidence)
- Project codebase: `src/api/*.ts`, `src/stores/*.ts`, `src/pages/*.tsx` -- current mock implementation
- Backend routes: `backend/app/routes/auth.py`, `grading.py`, `history.py` -- exact API contracts
- Backend schemas: `backend/app/schemas/*.py` -- response shapes with CamelModel alias generation

### Secondary (MEDIUM confidence)
- [Axios interceptors documentation](https://axios-http.com/docs/interceptors) -- request/response interceptor API
- [Zustand persist middleware docs](https://zustand.docs.pmnd.rs/reference/middlewares/persist) -- version and migrate function API

### Tertiary (LOW confidence)
- None -- all findings verified against project source code and official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- axios is well-understood, already decided in CONTEXT.md
- Architecture: HIGH -- mock layer is thin, backend contracts verified in source code
- Pitfalls: HIGH -- identified from direct comparison of frontend mocks vs backend route signatures (e.g., Form vs JSON, password length mismatch)

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable -- all libraries are established)
