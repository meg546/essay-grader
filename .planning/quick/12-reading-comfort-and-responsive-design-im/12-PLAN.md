---
phase: quick-12
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/stores/app-store.ts
  - src/components/grading/GradingSettings.tsx
  - src/components/grading/EssayInput.tsx
  - src/components/results/EssayPanel.tsx
  - src/index.css
  - index.html
  - src/lib/theme.ts
  - src/components/layout/Header.tsx
  - src/components/layout/LandingLayout.tsx
  - src/components/results/HighlightedEssay.tsx
  - src/components/results/ScoreBar.tsx
  - src/components/results/ColorLegend.tsx
  - src/components/landing/WalkthroughDemo.tsx
  - src/lib/highlight-utils.ts
  - src/lib/score-utils.ts
  - src/pages/GradingPage.tsx
  - src/components/grading/GradingToolbar.tsx
  - src/components/results/FeedbackPanel.tsx
autonomous: true
requirements: [TEXT-SIZE, DARK-MODE, MOBILE-GRADING]

must_haves:
  truths:
    - "User can change text size to small/normal/large and see essay text change accordingly"
    - "Text size preference persists across page refresh"
    - "User can toggle between light and dark mode via header icon"
    - "Dark mode respects system preference by default"
    - "No white flash on dark mode page load"
    - "All components render correctly in dark mode (no hardcoded light-only colors)"
    - "Grading page is fully usable on mobile (< 768px viewport)"
    - "Mobile results view has Essay/Feedback tab switching"
    - "Header collapses to hamburger menu on mobile"
  artifacts:
    - path: "src/lib/theme.ts"
      provides: "Theme detection, toggle, localStorage sync, meta theme-color"
    - path: "src/stores/app-store.ts"
      provides: "textSize state with version 3 migration"
    - path: "src/components/grading/GradingSettings.tsx"
      provides: "3-step text size selector UI"
  key_links:
    - from: "src/stores/app-store.ts"
      to: "src/components/grading/EssayInput.tsx"
      via: "useAppStore textSize selector"
      pattern: "useAppStore.*textSize"
    - from: "src/lib/theme.ts"
      to: "src/components/layout/Header.tsx"
      via: "theme toggle callback"
      pattern: "toggleTheme\\|setTheme"
    - from: "index.html"
      to: "src/lib/theme.ts"
      via: "flash prevention inline script + theme.ts runtime sync"
      pattern: "essay-grader-theme"
---

<objective>
Implement three cohesive reading comfort and responsive design features: text size control, dark mode with flash prevention, and mobile-optimized grading layout.

Purpose: Improve reading/writing experience across devices and lighting conditions.
Output: Text size selector in settings, dark/light theme toggle, fully responsive grading page.
</objective>

<execution_context>
@/Users/matthewgardner/.claude/get-shit-done/workflows/execute-plan.md
@/Users/matthewgardner/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@docs/superpowers/specs/2026-03-11-reading-comfort-responsive-design.md

<interfaces>
<!-- Current app store (version 2, partializes essayText only) -->
From src/stores/app-store.ts:
```typescript
interface AppState {
  currentResult: GradingResult | null;
  essayText: string;
  rubricFile: File | null;
  rubricText: string;
  setCurrentResult: (result: GradingResult) => void;
  clearCurrentResult: () => void;
  setEssayText: (text: string) => void;
  setRubricFile: (file: File | null) => void;
  setRubricText: (text: string) => void;
}
// persist config: name: "essay-grader-app", version: 2, partialize: essayText only
```

From src/components/grading/GradingSettings.tsx:
```typescript
interface GradingSettingsProps {
  gradeLevelOverride: string | null;
  onGradeLevelChange: (level: string | null) => void;
  userGradeLevel: string | null;
}
// Uses base-ui PopoverTrigger with `render` prop pattern
// PopoverContent side="left" align="start" className="w-52"
```

From src/components/grading/GradingToolbar.tsx:
```typescript
// Vertical flex-col layout, w-12, bg-muted/30, border-l
// ToolbarButton: 10x10 rounded-lg with Tooltip wrapper
// Uses base-ui Popover/Tooltip pattern
```

From src/components/layout/Header.tsx:
```typescript
// navItems: /grade (Home), /history (Essays), /profile (Profile)
// NavLinkItem with active state detection
// No mobile menu — full nav always visible
```

From src/components/layout/LandingLayout.tsx:
```typescript
// Simple header: logo + Sign In button
// No mobile menu
```

From src/pages/GradingPage.tsx:
```typescript
// Input view: flex layout with EssayInput + GradingToolbar side by side
// Results view: grid grid-cols-1 lg:grid-cols-2 with EssayPanel + FeedbackPanel
// Submit button below input area
```

From src/index.css:
```css
/* Dark mode already configured via @custom-variant dark (&:is(.dark *)); */
/* .dark block at lines 53-85 has all base color tokens */
/* No --highlight-strength or --highlight-improvement tokens yet */
```

From src/lib/highlight-utils.ts:
```typescript
// CATEGORY_COLORS uses hardcoded Tailwind classes: bg-blue-100, text-blue-700, etc.
// These are intentional palette colors, not theme-token candidates
// But they need dark: variants added for dark mode visibility
```

From src/lib/score-utils.ts:
```typescript
// getScoreBarColor returns: bg-emerald-500, bg-amber-400, bg-rose-500
// getScoreTextColor returns: text-emerald-700, text-amber-600, text-rose-600
// These semantic colors work in both themes (Tailwind utility colors)
```

From src/components/ui/sheet.tsx:
```typescript
// Sheet component exists — use for mobile nav drawer
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Text Size Control</name>
  <files>src/stores/app-store.ts, src/components/grading/GradingSettings.tsx, src/components/grading/EssayInput.tsx, src/components/results/EssayPanel.tsx</files>
  <action>
**app-store.ts:**
- Add `textSize: 'small' | 'normal' | 'large'` to `AppState` interface, default `'normal'`
- Add `setTextSize: (size: 'small' | 'normal' | 'large') => void`
- Update `partialize` to include `textSize`: `(state) => ({ essayText: state.essayText, textSize: state.textSize })`
- Bump `version` to 3, add migration: `if (version < 3) { persisted.textSize = 'normal'; }`
- Keep existing version < 2 migration intact

**GradingSettings.tsx:**
- Import `useAppStore` to read/write `textSize`
- Below the existing grade level `Select`, add a divider and text size control section
- Render a segmented control with three options: Small (text-sm icon "A"), Normal (text-base icon "A"), Large (text-lg icon "A")
- Use a row of 3 buttons styled as a segmented control: `flex rounded-lg border border-border overflow-hidden` with each button having appropriate padding and active state (`bg-primary text-primary-foreground` for active, `bg-transparent text-muted-foreground hover:bg-muted` for inactive)
- Label above: "Text Size" in the same style as the existing "For this submission only" label
- The small A should use `text-xs`, normal A uses `text-sm`, large A uses `text-base` for the visual size anchors
- Update the "Reset to profile default" button logic: when clicked (isOverridden), also call `setTextSize('normal')`. Show the reset button if `isOverridden || textSize !== 'normal'`. Widen popover to `w-56` to accommodate the new control.

**EssayInput.tsx:**
- Import `useAppStore` textSize selector
- Create a `TEXT_SIZE_CLASS` map: `{ small: 'text-sm', normal: 'text-base', large: 'text-lg' }`
- Apply the mapped class to the `<Textarea>` className, replacing the hardcoded `text-base`

**EssayPanel.tsx:**
- Import `useAppStore` textSize selector
- Apply the same `TEXT_SIZE_CLASS` map to:
  1. The editing textarea (currently `text-sm`) — use the dynamic class
  2. The `<HighlightedEssay>` wrapper — wrap it in a `<div>` with the dynamic text size class applied
  </action>
  <verify>
    <automated>cd /Users/matthewgardner/essay-grader && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>Text size selector appears in GradingSettings popover with 3 options. Changing size updates essay textarea and results panel text. Preference persists in localStorage via store version 3. Reset button resets text size to normal.</done>
</task>

<task type="auto">
  <name>Task 2: Dark Mode</name>
  <files>src/index.css, index.html, src/lib/theme.ts, src/components/layout/Header.tsx, src/components/layout/LandingLayout.tsx, src/components/results/HighlightedEssay.tsx, src/components/landing/WalkthroughDemo.tsx, src/lib/highlight-utils.ts, src/lib/score-utils.ts</files>
  <action>
**src/lib/theme.ts (new file):**
- Create theme module that works outside React (no Zustand dependency)
- Types: `type Theme = 'system' | 'light' | 'dark'`, `type ResolvedTheme = 'light' | 'dark'`
- `getTheme(): Theme` — reads from `localStorage.getItem('essay-grader-theme')`, returns `'system'` if null/invalid
- `getResolvedTheme(): ResolvedTheme` — if stored theme is `'light'`/`'dark'` return it, else check `matchMedia('(prefers-color-scheme: dark)').matches`
- `setTheme(theme: Theme): void` — stores in localStorage (remove key if `'system'`), applies `.dark` class to `document.documentElement`, updates meta theme-color
- `toggleTheme(): void` — if current resolved is `'light'` set `'dark'`, else set `'light'`
- `onThemeChange(callback: (resolved: ResolvedTheme) => void): () => void` — subscribe pattern using a Set of listeners, also listen to `matchMedia` change event for system theme changes. Call listeners whenever resolved theme changes.
- Private `applyTheme()` helper that adds/removes `.dark` from `<html>`, updates `<meta name="theme-color">` content (light: `#faf9f6`, dark: `#0f1117`), and notifies listeners
- Add `useTheme()` React hook at bottom of file: uses `useSyncExternalStore` with `onThemeChange` as subscribe, `getResolvedTheme` as getSnapshot. Returns `{ theme: getTheme(), resolvedTheme, setTheme, toggleTheme }`.

**index.html:**
- Add `<meta name="theme-color" content="#faf9f6">` in `<head>`
- Add inline flash prevention script BEFORE the module script, inside `<head>`:
```html
<script>
(function(){var t=localStorage.getItem('essay-grader-theme');var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches);if(d){document.documentElement.classList.add('dark');document.querySelector('meta[name="theme-color"]').content='#0f1117'}})();
</script>
```

**src/index.css:**
- Add to `:root` block: `--highlight-strength: 142 76% 90%;` and `--highlight-improvement: 38 92% 90%;`
- Add to `.dark` block: `--highlight-strength: 142 40% 25%;` and `--highlight-improvement: 38 50% 25%;`
- Add `transition-colors duration-200` to the `html` rule in `@layer base`

**Header.tsx:**
- Import `Sun`, `Moon` from lucide-react
- Import `useTheme` from `@/lib/theme`
- Add theme toggle button BEFORE the `<nav>` element (between branding and nav)
- Button: `<button onClick={toggleTheme} className="...">` with Sun icon when resolved is light, Moon icon when resolved is dark
- Style: same as nav link items but icon-only, `p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors`
- Add `aria-label="Toggle dark mode"`
- For mobile (Task 3 will add hamburger), keep theme toggle always visible — do NOT collapse it into mobile menu

**LandingLayout.tsx:**
- Same theme toggle addition: import `useTheme`, add Sun/Moon toggle button next to the Sign In button
- Style consistently with Header toggle

**Dark mode audit — fix hardcoded colors:**

*highlight-utils.ts:*
- Update `CATEGORY_COLORS` to include dark mode variants:
  - `{ bg: "bg-blue-100 dark:bg-blue-900/40", bgActive: "bg-blue-200 dark:bg-blue-800/60", text: "text-blue-700 dark:text-blue-300" }`
  - Same pattern for purple, orange, teal, pink, yellow (light-100/dark-900/40 for bg, light-200/dark-800/60 for bgActive, light-700/dark-300 for text)

*score-utils.ts:*
- Score bar colors (`bg-emerald-500`, `bg-amber-400`, `bg-rose-500`) are fine for both themes — these are vibrant mid-range colors that work on both light and dark `bg-muted` backgrounds. No changes needed.
- Score text colors: update to add dark variants:
  - high: `text-emerald-700 dark:text-emerald-400`
  - medium: `text-amber-600 dark:text-amber-400`
  - low: `text-rose-600 dark:text-rose-400`

*WalkthroughDemo.tsx:*
- The `bg-emerald-500` and `bg-amber-500` in `SCORES` array are fine (mid-range utility colors on `bg-border` track)
- The highlight example at bottom: `bg-emerald-500/20` and `text-emerald-600 dark:text-emerald-400` — already has dark variant for text. Check bg: the `/20` opacity works in both themes. No change needed there since it already uses `dark:text-emerald-400`.
- The `bg-background`, `bg-card`, `border-border`, `text-foreground`, `text-muted-foreground` usages are all token-based and auto-adapt. No changes needed.

*HighlightedEssay.tsx:*
- Uses `getCategoryColor()` from highlight-utils, so fixing the source handles this. No direct changes needed here.

*EssayInput.tsx (drop zone overlay):*
- The `ring-2 ring-primary ring-inset` drag state is token-based already. No changes needed.

*LandingLayout.tsx skip-to-content link:*
- Change `focus:bg-white` to `focus:bg-background` (already a token)
  </action>
  <verify>
    <automated>cd /Users/matthewgardner/essay-grader && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>Dark/light theme toggle in both Header and LandingLayout headers. Theme persists in localStorage. No white flash on dark mode reload. All highlight colors, score colors, and component backgrounds work in both themes. Meta theme-color updates dynamically.</done>
</task>

<task type="auto">
  <name>Task 3: Mobile-Optimized Grading</name>
  <files>src/pages/GradingPage.tsx, src/components/grading/GradingToolbar.tsx, src/components/grading/EssayInput.tsx, src/components/results/EssayPanel.tsx, src/components/results/FeedbackPanel.tsx, src/components/layout/Header.tsx, src/components/layout/LandingLayout.tsx</files>
  <action>
**GradingPage.tsx — Input view (mobile):**
- Change the outer container from `h-[calc(100vh-7rem)]` to `h-[calc(100vh-7rem)] md:h-[calc(100vh-7rem)]` — on mobile, let it be `min-h-[calc(100vh-7rem)]` instead of fixed height so content can scroll naturally
- The `flex flex-1 min-h-0 border rounded-lg overflow-hidden` wrapper: on mobile, make it `flex-col` so EssayInput stacks above toolbar: `flex flex-col md:flex-row flex-1 min-h-0 border rounded-lg overflow-hidden`
- Submit button: wrap in a sticky container on mobile: `<div className="pt-4 shrink-0 md:relative sticky bottom-0 bg-background pb-4 md:pb-0">` and make button full-width on mobile: `w-full md:w-auto`

**GradingPage.tsx — Results view (mobile):**
- Add `resultTab` state: `const [resultTab, setResultTab] = useState<'essay' | 'feedback'>('essay')`
- Above the grid, add a tab bar visible only on mobile: `<div className="flex md:hidden border-b mb-4">`
  - Two tab buttons: "Essay" and "Feedback"
  - Active tab: `border-b-2 border-primary text-primary font-medium`
  - Inactive: `text-muted-foreground`
  - Each button: `flex-1 py-2.5 text-sm text-center` with min 44px touch target
- The existing `grid grid-cols-1 gap-6 lg:grid-cols-2` stays for desktop
- On mobile, conditionally show panels: wrap EssayPanel in `<div className="md:block" style={{ display: resultTab === 'essay' ? undefined : 'none' }} className="md:!block">` — actually use `hidden md:block` pattern:
  - `<div className={cn("md:block", resultTab !== 'essay' && "hidden")}><EssayPanel .../></div>`
  - `<div className={cn("md:block", resultTab !== 'feedback' && "hidden")}><FeedbackPanel .../></div>`
- Score summary (ColorLegend) stays above tabs — already positioned correctly

**GradingToolbar.tsx — Horizontal on mobile:**
- Change the outer div from `flex flex-col items-center w-12 bg-muted/30 border-l py-2 gap-1` to: `flex flex-row md:flex-col items-center w-full md:w-12 bg-muted/30 border-t md:border-t-0 md:border-l py-2 gap-1 shrink-0 justify-center md:justify-start overflow-x-auto`
- Dividers: change `w-6 border-b my-1` to `w-6 md:w-6 border-b md:border-b border-r md:border-r-0 h-6 md:h-auto my-0 md:my-1 mx-1 md:mx-0` — simpler: just hide dividers on mobile with `hidden md:block w-6 border-b my-1`
- The toolbar popover content (Clear confirmation, ToneSelector, GradingSettings): keep `side="left"` but add responsive fallback — these use base-ui Popover which auto-positions. The `side="left"` is fine, Popover handles viewport collision.

**EssayInput.tsx — Mobile full-width:**
- The component is already `flex-1 flex flex-col min-h-0` which works for both layouts. Add `min-h-[250px] md:min-h-[200px]` to the Textarea for a taller mobile touch area.

**EssayPanel.tsx:**
- No prop changes needed — the parent GradingPage handles visibility via CSS classes

**FeedbackPanel.tsx:**
- No prop changes needed — same as EssayPanel

**Header.tsx — Mobile hamburger menu:**
- Import `Menu` from lucide-react
- Import `Sheet`, `SheetTrigger`, `SheetContent` from `@/components/ui/sheet`
- Wrap the nav section: desktop nav stays as `<nav className="hidden md:flex gap-1">...</nav>`
- Add mobile hamburger: `<div className="flex md:hidden items-center gap-2">` containing the theme toggle (from Task 2) and a `<Sheet>` trigger button
- Sheet trigger: `<button className="p-2 rounded-lg text-muted-foreground hover:bg-muted" aria-label="Open menu"><Menu className="size-5" /></button>`
- SheetContent: render the same `navItems` as vertical stack of NavLinkItem components, each `w-full text-left`. Close sheet on nav click (use sheet's onOpenChange).
- Keep theme toggle OUTSIDE the hamburger menu (always visible in header bar), positioned between logo and hamburger icon
- Restructure header layout: `<div className="flex h-16 items-center justify-between px-5">` with left=branding, right=`<div className="flex items-center gap-2">{themeToggle}{desktopNav}{mobileHamburger}</div>`

**LandingLayout.tsx — Mobile hamburger menu:**
- Same pattern: hamburger visible < md, Sheet with Sign In button inside
- Keep theme toggle always visible
- Right side of header: `<div className="flex items-center gap-2">{themeToggle}<Button className="hidden md:inline-flex" ...>Sign In</Button>{mobileSheet with Sign In inside}</div>`

**Landing page touch-ups (minor):**
- These are handled by the existing responsive classes. The hero section and feature cards in the landing page already use responsive Tailwind classes. Verify but likely no changes needed — the landing page components were designed mobile-first.
  </action>
  <verify>
    <automated>cd /Users/matthewgardner/essay-grader && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>Grading page fully usable at < 768px: stacked layout, horizontal toolbar, tab-based results, sticky submit. Header and landing header have hamburger menu on mobile with Sheet drawer. Touch targets are minimum 44px. Desktop layout unchanged.</done>
</task>

</tasks>

<verification>
1. TypeScript compiles: `npx tsc --noEmit` passes with no errors
2. Dev server runs: `npm run dev` starts without errors
3. Visual check: text size control visible in settings popover, all 3 sizes work
4. Visual check: theme toggle in header, dark mode applies across all pages
5. Visual check: resize browser to < 768px, grading page shows mobile layout
</verification>

<success_criteria>
- Text size selector with 3 options in GradingSettings, persisted in store v3
- Dark/light toggle in both headers, flash-free dark mode, all components themed
- Mobile grading layout with horizontal toolbar, tab results, hamburger nav
- TypeScript compiles, no regressions in desktop layout
</success_criteria>

<output>
After completion, create `.planning/quick/12-reading-comfort-and-responsive-design-im/12-SUMMARY.md`
</output>
