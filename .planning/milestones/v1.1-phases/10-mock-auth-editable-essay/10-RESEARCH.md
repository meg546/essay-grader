# Phase 10: Mock Auth & Editable Essay - Research

**Researched:** 2026-03-09
**Domain:** React form auth flow + in-place essay editing with re-grading
**Confidence:** HIGH

## Summary

Phase 10 adds two independent feature clusters to the existing essay grader: (1) a mock authentication flow on the Profile page with email+password form, format validation, simulated async delay, and sign-out; (2) in-place essay editing in the results view left panel with a re-submit button that triggers re-grading without navigation.

Both features build directly on existing infrastructure. The profile store (`useProfileStore`) already has `signIn`/`signOut`/`isSignedIn` state -- it just needs a password field added and validation logic. The grading page (`GradingPage.tsx`) already has a `handleSubmit` function and access to `essayText` via the app store -- the EssayPanel just needs to switch between read-only highlighted view and an editable textarea, then call the existing grading flow.

**Primary recommendation:** Split into two plans -- one for auth (Profile page changes + store update) and one for editable essay (EssayPanel toggle + re-grading flow in GradingPage). Both are self-contained with no cross-dependencies.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | Profile page shows email+password sign-in form when not authenticated | Existing `ProfilePage.tsx` already conditionally renders sign-in vs signed-in state; needs password field added |
| AUTH-02 | Mock sign-in validates email format and password length, simulates async delay | Use HTML5 `type="email"` + `required` for email, manual `minLength` check for password, `delay()` utility already exists |
| AUTH-03 | After sign-in, profile page displays settings and history | Already implemented -- settings (grade level) and history cards render when `isSignedIn` is true |
| AUTH-04 | User can sign out, returning to sign-in form | Already implemented via `signOut()` in profile store; just needs to persist through the new form |
| EDIT-01 | User can edit essay text in the results view left panel | EssayPanel needs edit mode toggle: switch from HighlightedEssay to textarea bound to app store `essayText` |
| EDIT-02 | User can resubmit edited essay for re-grading without navigating away | Add "Re-grade" button to results view that calls existing `gradeEssay()` and updates `currentResult` in place |
| EDIT-03 | During re-grading, results panel shows loading state while essay remains visible | FeedbackPanel shows spinner/skeleton overlay while `isRegrading` is true; EssayPanel stays interactive |
</phase_requirements>

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^19.2.0 | UI framework | Already in use |
| Zustand | ^5.0.11 | State management (profile-store, app-store) | Already manages auth and essay state |
| React Router | ^7.13.1 | Routing | Already in use, no new routes needed |
| Lucide React | ^0.577.0 | Icons (Loader2, Pencil, Check, etc.) | Already used for loading spinners |
| Motion | ^12.35.1 | Animations | Already used for hero transitions |

### Supporting (already in project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui components | N/A | Input, Button, Card, Label | Already in `components/ui/` |
| Sonner | ^2.0.7 | Toast notifications | Error/success messages on sign-in |
| Tailwind CSS | ^4.2.1 | Styling | All component styling |

### Alternatives Considered
No new libraries needed. Everything required is already in the project.

**Installation:**
```bash
# No new packages required
```

## Architecture Patterns

### Current Project Structure (relevant files)
```
src/
  stores/
    profile-store.ts    # Auth state (email, isSignedIn, signIn, signOut)
    app-store.ts        # Essay state (essayText, currentResult, history)
  pages/
    ProfilePage.tsx     # Profile/auth page
    GradingPage.tsx     # Grading + results page
  components/
    results/
      EssayPanel.tsx    # Left panel in results (currently read-only)
      FeedbackPanel.tsx # Right panel in results
      HighlightedEssay.tsx # Highlighted essay display
  api/
    grading.ts          # gradeEssay() mock API
    delay.ts            # delay() utility
```

### Pattern 1: Enhancing Profile Store for Password Auth
**What:** Extend existing `useProfileStore` to include password validation and async sign-in
**When to use:** AUTH-01, AUTH-02, AUTH-04

The current `signIn(email)` is synchronous and takes only email. It needs to:
1. Accept email + password
2. Validate email format (regex or rely on HTML5 `type="email"`)
3. Validate password length (e.g., >= 6 chars)
4. Return a promise with simulated delay
5. Set `isSignedIn: true` on success

```typescript
// Profile store additions
interface ProfileState {
  // ... existing fields
  isSigningIn: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

// Implementation
signIn: async (email, password) => {
  set({ isSigningIn: true });
  await delay(1000);
  // Validate
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    set({ isSigningIn: false });
    return { success: false, error: "Invalid email format" };
  }
  if (password.length < 6) {
    set({ isSigningIn: false });
    return { success: false, error: "Password must be at least 6 characters" };
  }
  set({ email, isSignedIn: true, isSigningIn: false });
  return { success: true };
},
```

### Pattern 2: Editable Essay with Mode Toggle
**What:** EssayPanel switches between highlighted read view and editable textarea
**When to use:** EDIT-01, EDIT-02

```typescript
// EssayPanel with edit mode
function EssayPanel({ result }: EssayPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const essayText = useAppStore((s) => s.essayText);
  const setEssayText = useAppStore((s) => s.setEssayText);

  return (
    <Card className="lg:h-[calc(100vh-14rem)] lg:overflow-y-auto">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Essay</h2>
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? <Check /> : <Pencil />}
          </Button>
        </div>
        {isEditing ? (
          <textarea
            value={essayText}
            onChange={(e) => setEssayText(e.target.value)}
            className="w-full h-full min-h-[300px] ..."
          />
        ) : (
          <HighlightedEssay result={result} />
        )}
      </CardContent>
    </Card>
  );
}
```

### Pattern 3: Re-grading Flow in GradingPage
**What:** Add re-grade capability to the results view without navigating away
**When to use:** EDIT-02, EDIT-03

The existing `handleSubmit` in GradingPage already does the right thing -- calls `gradeEssay()`, sets `currentResult`, adds to history. A re-grade just needs a similar flow triggered from the results view:

```typescript
// In GradingPage results section
const [isRegrading, setIsRegrading] = useState(false);

async function handleRegrade() {
  setIsRegrading(true);
  try {
    const result = await gradeEssay({ essayText, rubricFile, gradeLevel });
    setCurrentResult(result);
    addToHistory(result);
  } catch {
    toast.error("Re-grading failed. Please try again.");
  } finally {
    setIsRegrading(false);
  }
}

// Pass isRegrading to FeedbackPanel for loading overlay
<FeedbackPanel result={currentResult} isLoading={isRegrading} />
```

### Anti-Patterns to Avoid
- **Separate auth API module:** Don't create a new `api/auth.ts` for mock auth. The validation is simple enough to live in the store or component. Keep it proportional.
- **Full textarea replacement of HighlightedEssay:** Don't try to make a textarea that also shows highlights. Toggle between two modes cleanly.
- **Navigating away for re-grading:** The requirement explicitly says "without navigating away." Don't use router navigation or reset the page state.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email validation | Custom regex parser | HTML5 `type="email"` + simple regex for store validation | Browser handles most edge cases |
| Loading overlay | Custom CSS overlay from scratch | Existing Loader2 spinner + opacity overlay pattern already used in project | Consistency with existing loading states |
| Form state | Custom form state machine | React useState (project pattern) | Project doesn't use form libraries; keep consistent |

## Common Pitfalls

### Pitfall 1: Zustand persist + async signIn
**What goes wrong:** Making `signIn` async in a persisted Zustand store can cause issues if the loading state (`isSigningIn`) gets persisted to localStorage.
**Why it happens:** The `persist` middleware serializes the entire state by default.
**How to avoid:** Use `partialize` to exclude `isSigningIn` from persistence (profile-store already persists everything by default, so add partialize).
**Warning signs:** Page reload during sign-in shows stuck loading state.

### Pitfall 2: Essay text sync between store and result
**What goes wrong:** `currentResult.essayText` and `appStore.essayText` can diverge after editing.
**Why it happens:** After initial grading, `currentResult.essayText` is set from the API response, but edits update `appStore.essayText`.
**How to avoid:** When entering edit mode, ensure `appStore.essayText` is synced with `currentResult.essayText`. When re-grading, use `appStore.essayText` as the source of truth.
**Warning signs:** Highlights don't match text after editing.

### Pitfall 3: Highlight context state during re-grade
**What goes wrong:** Active highlights, scroll targets, and tooltip state from the previous result persist into the new result.
**Why it happens:** HighlightProvider state isn't reset when currentResult changes.
**How to avoid:** Reset highlight context when re-grading starts or when a new result arrives. Use `key={currentResult.id}` on HighlightProvider to force re-mount.
**Warning signs:** Tooltips reference old categories, scroll targets jump to wrong positions.

### Pitfall 4: Conditional rendering of settings/history on Profile page
**What goes wrong:** AUTH-03 says "after sign-in, profile page displays settings and history." Currently settings and history always show regardless of auth state.
**Why it happens:** The current ProfilePage doesn't gate content behind `isSignedIn`.
**How to avoid:** Wrap the Grade Level and Grading History cards in an `{isSignedIn && ...}` block, or show them always with a note -- check requirement carefully. The requirement says "displays settings and history" after sign-in, implying they should be hidden when not signed in.
**Warning signs:** Settings visible before signing in.

## Code Examples

### Current ProfilePage sign-in form (to be modified)
The existing form only has email input and no password. It needs:
1. Password `<Input type="password">` field added
2. Validation before calling `signIn`
3. Loading state during simulated delay
4. Error message display
5. Settings/history cards conditionally shown when `isSignedIn`

### Current GradingPage results view (to be modified)
The results section (lines 60-78 of GradingPage.tsx) renders:
- Header with "Grading Results" + "Grade Another" button
- ColorLegend
- Two-column grid: EssayPanel + FeedbackPanel

Needs added:
- "Re-grade" button (next to "Grade Another" or in EssayPanel)
- `isRegrading` state passed to FeedbackPanel
- EssayPanel needs edit toggle capability

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Current: email-only sign-in | Needs: email+password with validation | Phase 10 | Profile store signIn signature changes |
| Current: read-only EssayPanel | Needs: toggle edit mode | Phase 10 | EssayPanel gets internal state |
| Current: grade-then-reset flow | Needs: in-place re-grade | Phase 10 | GradingPage gets regrade handler |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected -- no test framework installed |
| Config file | None |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Sign-in form renders when not authenticated | manual-only | Visual inspection | N/A |
| AUTH-02 | Email/password validation + delay | manual-only | Visual inspection | N/A |
| AUTH-03 | Settings/history visible after sign-in | manual-only | Visual inspection | N/A |
| AUTH-04 | Sign out returns to form | manual-only | Visual inspection | N/A |
| EDIT-01 | Essay editable in results view | manual-only | Visual inspection | N/A |
| EDIT-02 | Re-submit without navigation | manual-only | Visual inspection | N/A |
| EDIT-03 | Loading state during re-grade | manual-only | Visual inspection | N/A |

**Justification for manual-only:** Project has no test framework installed. All requirements are UI-behavioral and best verified by visual inspection in the browser. Installing a test framework would be out of scope for this phase.

### Sampling Rate
- **Per task commit:** `npm run build` (type-check + bundle)
- **Per wave merge:** `npm run build && npm run lint`
- **Phase gate:** Build succeeds, lint passes, manual walkthrough of all 7 requirements

### Wave 0 Gaps
None -- no test infrastructure exists and adding one is out of scope for this phase.

## Open Questions

1. **Should settings/history be hidden when not signed in?**
   - What we know: AUTH-03 says "after sign-in, profile page displays settings and history"
   - What's unclear: Does this mean they should be hidden before sign-in, or just that they continue to show?
   - Recommendation: Hide them when not signed in -- this gives the auth flow a clear purpose and matches the requirement wording. The sign-in form should be the primary/only content for unauthenticated users.

2. **Where should the "Re-grade" button live?**
   - What we know: User edits essay in left panel, wants to re-submit
   - What's unclear: Button placement -- in EssayPanel header, in the top bar next to "Grade Another", or both?
   - Recommendation: Place in the EssayPanel header next to the edit toggle. This keeps the action close to where the editing happens. Show it only when essay text has changed from the current result.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of all relevant source files
- `src/stores/profile-store.ts` - current auth state shape
- `src/stores/app-store.ts` - current essay/result state shape
- `src/pages/ProfilePage.tsx` - current profile page implementation
- `src/pages/GradingPage.tsx` - current grading/results flow
- `src/components/results/EssayPanel.tsx` - current essay display
- `src/api/grading.ts` - existing mock grading API

### Secondary (MEDIUM confidence)
- Zustand v5 persist middleware behavior (from training data, consistent with code patterns observed)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new libraries needed, all already in project
- Architecture: HIGH - straightforward extensions of existing patterns
- Pitfalls: HIGH - identified from direct code analysis of state management and component interactions

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable -- no external dependencies changing)
