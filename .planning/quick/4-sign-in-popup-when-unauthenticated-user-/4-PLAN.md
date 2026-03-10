---
phase: quick-4
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/ui/dialog.tsx
  - src/components/auth/SignInDialog.tsx
  - src/pages/GradingPage.tsx
autonomous: true
requirements: [QUICK-4]
must_haves:
  truths:
    - "Unauthenticated user clicking Submit for Grading sees a sign-in popup instead of an API error"
    - "User can sign in directly from the popup dialog"
    - "User can switch to register mode within the popup"
    - "After successful sign-in or registration, the dialog closes and grading proceeds automatically"
    - "Authenticated users see no change in behavior"
  artifacts:
    - path: "src/components/ui/dialog.tsx"
      provides: "Reusable dialog component built on @base-ui/react Dialog primitives"
    - path: "src/components/auth/SignInDialog.tsx"
      provides: "Sign-in/register dialog with login form, register form, and tab toggle"
    - path: "src/pages/GradingPage.tsx"
      provides: "Updated grading page that intercepts submit for unauthenticated users"
  key_links:
    - from: "src/pages/GradingPage.tsx"
      to: "src/components/auth/SignInDialog.tsx"
      via: "open state + onAuthenticated callback"
      pattern: "SignInDialog.*onAuthenticated"
    - from: "src/components/auth/SignInDialog.tsx"
      to: "src/stores/profile-store.ts"
      via: "useProfileStore signIn/register"
      pattern: "useProfileStore"
---

<objective>
Add a sign-in dialog that appears when an unauthenticated user attempts to grade an essay. The dialog contains login/register forms (reusing the same pattern from ProfilePage) and a button to navigate to the register screen. After successful authentication, grading proceeds automatically.

Purpose: Prevent unauthenticated API errors and provide a smooth inline auth flow without navigating away from the grading page.
Output: Dialog component, SignInDialog component, updated GradingPage.
</objective>

<execution_context>
@/Users/matthewgardner/.claude/get-shit-done/workflows/execute-plan.md
@/Users/matthewgardner/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/pages/GradingPage.tsx
@src/stores/profile-store.ts
@src/api/auth.ts
@src/components/ui/sheet.tsx
@src/pages/ProfilePage.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create Dialog UI component using @base-ui/react Dialog primitives</name>
  <files>src/components/ui/dialog.tsx</files>
  <action>
Create a Dialog component following the exact same pattern as sheet.tsx but styled as a centered modal dialog instead of a slide-in sheet. Use `@base-ui/react/dialog` (same import as sheet.tsx uses: `Dialog as DialogPrimitive`).

Export these components:
- `Dialog` (Root)
- `DialogTrigger` (Trigger)
- `DialogClose` (Close)
- `DialogContent` (Popup — centered overlay modal with max-w-md, rounded-lg, bg-background, shadow-lg, p-6, animate-in/out with fade and zoom)
- `DialogHeader` (div with flex-col gap)
- `DialogFooter` (div with flex gap)
- `DialogTitle` (Title)
- `DialogDescription` (Description)

For DialogContent: render a Portal + Backdrop (same overlay as SheetOverlay) + Popup centered with `fixed inset-0 z-50 flex items-center justify-center`. The Popup itself: `bg-background rounded-lg shadow-lg p-6 w-full max-w-md mx-4` with animate-in fade-in + zoom-in-95 and animate-out fade-out + zoom-out-95. Include a close X button in the top-right corner (same pattern as sheet.tsx).

Use `data-slot` attributes matching shadcn v4 conventions (e.g., `data-slot="dialog-content"`).
  </action>
  <verify>
    <automated>npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>Dialog component exists, type-checks, follows same pattern as sheet.tsx</done>
</task>

<task type="auto">
  <name>Task 2: Create SignInDialog and wire into GradingPage submit flow</name>
  <files>src/components/auth/SignInDialog.tsx, src/pages/GradingPage.tsx</files>
  <action>
**SignInDialog component** (`src/components/auth/SignInDialog.tsx`):

Props: `{ open: boolean; onOpenChange: (open: boolean) => void; onAuthenticated: () => void }`

Internal state: `mode` ("login" | "register"), `emailInput`, `passwordInput`, `confirmPasswordInput`, `error`.

UI structure using the Dialog component from Task 1:
- DialogHeader with DialogTitle "Sign in to continue" and DialogDescription "You need an account to grade essays."
- Tab toggle between Login and Register (reuse the same styled buttons pattern from ProfilePage lines 100-123: border-b tabs with primary underline for active)
- Login mode: email input, password input (minLength=8), error message, "Sign In" button with Loader2 spinner when isSigningIn
- Register mode: email input, password input, confirm password input, error message, "Create Account" button with Loader2 spinner
- Use `useProfileStore` for `signIn`, `register`, and `isSigningIn`
- On successful signIn/register: call `onAuthenticated()` (do NOT close manually -- the parent will close via onOpenChange)
- Reset form state (emailInput, passwordInput, confirmPasswordInput, error, mode) when `open` changes to `false` (useEffect on `open`)

**GradingPage changes** (`src/pages/GradingPage.tsx`):

1. Import `useProfileStore` isSignedIn selector and `SignInDialog`
2. Add state: `const [showSignIn, setShowSignIn] = useState(false)`
3. Add `const isSignedIn = useProfileStore((s) => s.isSignedIn)`
4. Modify `handleSubmit`: at the top, before `setIsGrading(true)`, check `if (!isSignedIn) { setShowSignIn(true); return; }`. This intercepts the submit for unauthenticated users.
5. Create `handleAuthenticated` callback: `setShowSignIn(false)` then call `handleSubmit()` (the user just authenticated, so the isSignedIn check will pass this time).
6. Render `<SignInDialog open={showSignIn} onOpenChange={setShowSignIn} onAuthenticated={handleAuthenticated} />` at the bottom of the returned JSX (in both the result view and the input view, or just once outside the conditional).
  </action>
  <verify>
    <automated>npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>Unauthenticated user clicking "Submit for Grading" sees sign-in dialog. Signing in or registering closes dialog and auto-submits. Authenticated users are unaffected.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with no errors
2. Manual: Open app without being signed in, paste essay text, click "Submit for Grading" -- sign-in dialog appears
3. Manual: Sign in via dialog -- dialog closes and grading begins automatically
4. Manual: Open dialog, switch to Register tab, create account -- dialog closes and grading begins
5. Manual: Sign in first via Profile page, then submit essay -- no dialog, grading proceeds directly
</verification>

<success_criteria>
- Dialog component is reusable and follows project conventions (base-ui primitives, shadcn v4 patterns)
- Unauthenticated submit shows sign-in popup with login/register tabs
- Successful auth closes dialog and triggers grading automatically
- Authenticated users experience no change
- TypeScript compiles cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/4-sign-in-popup-when-unauthenticated-user-/4-SUMMARY.md`
</output>
