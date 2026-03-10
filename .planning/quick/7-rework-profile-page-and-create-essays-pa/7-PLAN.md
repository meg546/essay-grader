---
phase: quick-7
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/app/routes/auth.py
  - backend/app/schemas/auth.py
  - src/api/auth.ts
  - src/pages/EssaysPage.tsx
  - src/pages/ProfilePage.tsx
  - src/components/profile/ChangePasswordDialog.tsx
  - src/components/profile/DeleteAccountDialog.tsx
  - src/components/layout/Header.tsx
  - src/App.tsx
autonomous: true
requirements: [QUICK-7]
must_haves:
  truths:
    - "User can browse essay history as a card grid at /history"
    - "Each essay card shows text preview snippet, date graded, and overall score"
    - "Clicking a card navigates to the full grading result"
    - "Empty state shown for users with no history"
    - "Profile page shows email read-only, password change button, grade level selector, writing purpose selector, and delete account"
    - "Password change works via modal dialog requiring current password"
    - "Toolbar History icon and header nav both correctly route to /history"
  artifacts:
    - path: "src/pages/EssaysPage.tsx"
      provides: "Card grid history page"
    - path: "src/pages/ProfilePage.tsx"
      provides: "Simplified profile settings page"
    - path: "src/components/profile/ChangePasswordDialog.tsx"
      provides: "Password change modal"
    - path: "src/components/profile/DeleteAccountDialog.tsx"
      provides: "Delete account confirmation dialog"
    - path: "backend/app/routes/auth.py"
      provides: "change-password and delete-account endpoints"
  key_links:
    - from: "src/pages/EssaysPage.tsx"
      to: "/api/history"
      via: "getHistory() call"
    - from: "src/components/profile/ChangePasswordDialog.tsx"
      to: "/api/auth/change-password"
      via: "apiClient.post"
    - from: "src/App.tsx"
      to: "EssaysPage"
      via: "Route path=/history"
---

<objective>
Split the current ProfilePage (which combines account info + history) into two separate pages: an Essays page at /history showing a card grid of graded essays, and a simplified Profile page at /profile with account settings, password change modal, and delete account.

Purpose: Better UX separation -- history browsing is a distinct activity from account management. Card grid is more visual and scannable than a list.
Output: New EssaysPage.tsx, reworked ProfilePage.tsx, ChangePasswordDialog.tsx, DeleteAccountDialog.tsx, backend endpoints for password change and account deletion.
</objective>

<execution_context>
@/Users/matthewgardner/.claude/get-shit-done/workflows/execute-plan.md
@/Users/matthewgardner/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/pages/ProfilePage.tsx
@src/api/history.ts
@src/api/auth.ts
@src/api/types.ts
@src/stores/profile-store.ts
@src/components/auth/SignInDialog.tsx
@src/App.tsx
@src/components/layout/Header.tsx
@backend/app/routes/auth.py
@backend/app/schemas/auth.py

<interfaces>
<!-- Key types and contracts the executor needs -->

From src/api/types.ts:
```typescript
export interface HistoryItem {
  id: string;
  essayExcerpt: string;
  overallScore: number;
  maxScore: number;
  categoryCount: number;
  gradedAt: string;
}
```

From src/api/auth.ts:
```typescript
export async function getMe(): Promise<UserProfile>;
export async function updateProfile(updates: { gradeLevel?: string; writingPurpose?: string }): Promise<UserProfile>;
```

From src/stores/profile-store.ts:
```typescript
export type GradeLevel = "elementary" | "middle-school" | "high-school" | "college";
export type WritingPurpose = "work" | "school" | "other";
export const GRADE_LEVEL_LABELS: Record<GradeLevel, string>;
// Store has: email, gradeLevel, writingPurpose, isSignedIn, signOut, setGradeLevel, setWritingPurpose
```

From src/api/client.ts:
```typescript
export const apiClient; // axios instance with auth interceptor
```

From backend/app/schemas/auth.py:
```python
class UserUpdateRequest(CamelModel):
    grade_level: str | None = None
    writing_purpose: str | None = None
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add backend endpoints for password change and account deletion</name>
  <files>backend/app/routes/auth.py, backend/app/schemas/auth.py, src/api/auth.ts</files>
  <action>
1. In backend/app/schemas/auth.py, add two new Pydantic models:
   - `ChangePasswordRequest(BaseModel)` with fields: `current_password: str`, `new_password: str = Field(min_length=8)`
   - `DeleteAccountRequest(BaseModel)` with field: `password: str`

2. In backend/app/routes/auth.py, add two new endpoints:
   - `POST /auth/change-password`: Accepts ChangePasswordRequest, requires get_current_user. Verify current_password against user.hashed_password using verify_password(). If invalid, return 401 "Current password is incorrect". If valid, set user.hashed_password = hash_password(new_password), commit, return 200 {"message": "Password changed"}.
   - `DELETE /auth/me`: Accepts DeleteAccountRequest as body, requires get_current_user + db. Verify password against user.hashed_password. If invalid, return 401 "Incorrect password". If valid, delete user from db, commit, return 200 {"message": "Account deleted"}.

3. In src/api/auth.ts, add two new frontend API functions:
   - `changePassword(currentPassword: string, newPassword: string): Promise<void>` -- POST to /auth/change-password with {current_password, new_password} (snake_case for backend)
   - `deleteAccount(password: string): Promise<void>` -- DELETE to /auth/me with data: {password}
  </action>
  <verify>
    <automated>cd /Users/matthewgardner/essay-grader && cd backend && python -c "from app.schemas.auth import ChangePasswordRequest, DeleteAccountRequest; print('schemas OK')" && python -c "from app.routes.auth import router; routes = [r.path for r in router.routes]; assert '/change-password' in routes; assert '/me' in routes; print('routes OK')"</automated>
  </verify>
  <done>Backend has POST /auth/change-password and DELETE /auth/me endpoints. Frontend has changePassword() and deleteAccount() API functions.</done>
</task>

<task type="auto">
  <name>Task 2: Create EssaysPage and rework ProfilePage with dialogs</name>
  <files>src/pages/EssaysPage.tsx, src/pages/ProfilePage.tsx, src/components/profile/ChangePasswordDialog.tsx, src/components/profile/DeleteAccountDialog.tsx, src/App.tsx, src/components/layout/Header.tsx</files>
  <action>
1. Create src/components/profile/ChangePasswordDialog.tsx:
   - Dialog component following SignInDialog.tsx pattern (use Dialog, DialogContent, DialogHeader, DialogTitle from ui/dialog)
   - Props: `open: boolean, onOpenChange: (open: boolean) => void`
   - Form with 3 password inputs: current password, new password, confirm new password
   - On submit: call changePassword() from api/auth. On success show sonner toast "Password changed" and close dialog. On error show inline error message.
   - Reset form state when dialog closes (useEffect on open, same pattern as SignInDialog)

2. Create src/components/profile/DeleteAccountDialog.tsx:
   - Dialog component with destructive styling
   - Props: `open: boolean, onOpenChange: (open: boolean) => void`
   - Warning text: "This action cannot be undone. All your essays and grading history will be permanently deleted."
   - Password input for confirmation
   - Two buttons: Cancel (outline) and "Delete Account" (variant="destructive")
   - On submit: call deleteAccount() from api/auth. On success call signOut() from profile store and navigate to "/". On error show inline error.

3. Create src/pages/EssaysPage.tsx:
   - Move history logic from current ProfilePage into this new page
   - Page title "My Essays" with h1
   - Load history with getHistory() in useEffect (same pattern as current ProfilePage)
   - Display as responsive card grid: CSS grid with `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`
   - Each card (use Card/CardContent from ui/card):
     - Essay text preview: `item.essayExcerpt` truncated display (use `line-clamp-2` for 2-line preview)
     - Date graded: formatted with toLocaleDateString()
     - Overall score: `item.overallScore/item.maxScore` displayed prominently
     - Entire card is clickable (button wrapper or onClick handler)
     - On click: call getHistoryItem(item.id), set result in app store via setCurrentResult(), navigate to "/grade"
   - Loading state: show Loader2 spinner centered
   - Empty state: centered message "No essays graded yet. Submit your first essay to get started." with a Button linking to /grade
   - Sort items by most recent (gradedAt descending) -- the API likely already returns sorted, but ensure with `.sort((a, b) => new Date(b.gradedAt).getTime() - new Date(a.gradedAt).getTime())`

4. Rewrite src/pages/ProfilePage.tsx (complete replacement):
   - Remove ALL history-related code (getHistory, historyItems, historyLoading, handleHistoryClick, HistoryItem import)
   - Remove login/register form (users are already authenticated via ProtectedRoute)
   - Structure as a settings page with sections:
     a. **Account section** (Card): Email displayed as read-only text (from profile store). "Sign Out" button (variant="outline").
     b. **Password section** (Card): Show masked "********" text. "Change Password" button that opens ChangePasswordDialog.
     c. **Preferences section** (Card): Grade Level -- Select dropdown (reuse existing pattern with GRADE_LEVEL_LABELS, calls setGradeLevel). Writing Purpose -- Select dropdown with labels {work: "Work", school: "School", other: "Other"} (calls setWritingPurpose). Add WRITING_PURPOSE_LABELS constant to profile-store.ts: `export const WRITING_PURPOSE_LABELS: Record<WritingPurpose, string> = { work: "Work", school: "School", other: "Other" };`
     d. **Danger Zone section** (Card with border-destructive): "Delete Account" button (variant="destructive") opens DeleteAccountDialog.
   - Import and render ChangePasswordDialog and DeleteAccountDialog, manage open state with useState booleans

5. Update src/App.tsx:
   - Add import for EssaysPage
   - Add route: `<Route path="/history" element={<EssaysPage />} />` inside the ProtectedRoute + Layout group (next to /grade and /profile routes)

6. Update src/components/layout/Header.tsx:
   - Add "Essays" nav item between Home and Profile: `{ to: "/history", label: "Essays" }`
   - Keep existing Home and Profile items

7. Add WRITING_PURPOSE_LABELS to src/stores/profile-store.ts:
   - Export `const WRITING_PURPOSE_LABELS: Record<WritingPurpose, string> = { work: "Work", school: "School", other: "Other" };`
  </action>
  <verify>
    <automated>cd /Users/matthewgardner/essay-grader && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>EssaysPage renders card grid at /history with preview snippets, scores, dates, and click-to-view. ProfilePage shows account info, password change button with modal, grade level and writing purpose selectors, and delete account danger zone. Header nav includes Essays link. No TypeScript errors.</done>
</task>

</tasks>

<verification>
- TypeScript compiles with no errors: `npx tsc --noEmit`
- Dev server starts: `npm run dev` serves without errors
- /history route renders EssaysPage with card grid
- /profile route renders simplified ProfilePage with all sections
- GradingToolbar History icon still navigates to /history (already configured)
- Header shows Home, Essays, Profile nav items
</verification>

<success_criteria>
- Essays page at /history displays card grid of graded essays with preview snippet, date, and score
- Clicking a card loads the full grading result at /grade
- Empty state shown when no history exists
- Profile page shows email read-only, password change button (opens modal), grade level selector, writing purpose selector, delete account danger zone
- Password change modal requires current password confirmation
- Delete account requires password confirmation, signs out and redirects to /
- Navigation updated: Header has Essays link, toolbar History icon points to /history
</success_criteria>

<output>
After completion, create `.planning/quick/7-rework-profile-page-and-create-essays-pa/7-SUMMARY.md`
</output>
