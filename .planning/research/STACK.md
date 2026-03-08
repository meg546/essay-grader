# Technology Stack

**Project:** AI Essay Grader (Frontend)
**Researched:** 2026-03-08
**Overall Confidence:** HIGH

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| React | ^19.2.4 | UI framework | Project constraint. React 19 is stable and current. | HIGH |
| React DOM | ^19.2.4 | DOM rendering | Matches React version | HIGH |
| TypeScript | ^5.9.3 | Type safety | Project constraint. Catches bugs at compile time, essential for typed API layer that will swap from mocks to real backend | HIGH |
| Vite | ^7.3.1 | Build tool / dev server | Project constraint. Instant HMR, fast builds. Vite 7 is current stable | HIGH |
| @vitejs/plugin-react | ^5.1.4 | React fast refresh in Vite | Standard Vite+React integration, uses SWC for fast transforms | HIGH |

### Routing

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| react-router-dom | ^6.30.3 | Client-side routing | Project constrains to v6. Use latest v6 (6.30.3), not v7. v6 is mature and well-documented. Only 4 routes needed (landing, grading, results, history) -- v6 handles this trivially | HIGH |

**Note on React Router v7:** The latest react-router-dom is v7.13.1, which merges Remix concepts and introduces framework mode. For this project, v6 is the right call -- v7's framework features are overkill for a simple SPA with 4 routes, and the project explicitly specifies v6. Stick with v6.

### State Management

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Zustand | ^5.0.11 | Global state | Project constraint. Minimal boilerplate, no providers needed, TypeScript-first. Perfect for this scale -- stores for rubric config, submission state, and history. No Redux ceremony for what amounts to 2-3 small stores | HIGH |

### Styling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Tailwind CSS | ^4.2.1 | Utility-first CSS | Project constraint. Tailwind v4 is a major rewrite -- CSS-first config (no more tailwind.config.js), uses `@import "tailwindcss"` in CSS, auto-detects content sources. Much simpler setup than v3 | HIGH |
| @tailwindcss/vite | ^4.2.1 | Tailwind Vite plugin | Tailwind v4's recommended Vite integration. Replaces the old PostCSS plugin approach. Single plugin in vite.config.ts | HIGH |
| clsx | ^2.1.1 | Conditional class names | Tiny (228B), standard for conditional Tailwind classes. `clsx('btn', isActive && 'btn-active')` | HIGH |
| tailwind-merge | ^3.5.0 | Merge Tailwind classes without conflicts | Prevents class conflicts when composing component variants. Use with clsx via a `cn()` utility: `cn(...inputs) { return twMerge(clsx(inputs)) }` | HIGH |

### HTTP / API Layer

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Axios | ^1.13.6 | HTTP client | Project constraint. Interceptors, request/response transforms, better error handling than fetch. API layer will start with mock implementations behind async functions, then swap to real Axios calls by changing only function bodies | HIGH |

### UI Utilities

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Lucide React | ^0.577.0 | Icons | Tree-shakeable, consistent style, large icon set. Better than Heroicons for this use case (more education-relevant icons, cleaner API). Import only what you use: `import { FileText, CheckCircle } from 'lucide-react'` | MEDIUM |
| react-dropzone | ^15.0.0 | File upload drag-and-drop | De facto standard for file upload UIs in React. Handles drag-and-drop zones, file type validation (.txt, .pdf), and accessibility. Avoids building custom drag-and-drop from scratch | HIGH |
| sonner | ^2.0.7 | Toast notifications | Lightweight, beautiful toasts out of the box. For submission success/error feedback. Drop-in with `<Toaster />` and `toast.success('Essay submitted')` | MEDIUM |

### File Processing

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| pdfjs-dist | ^5.5.207 | PDF text extraction | Mozilla's PDF.js. Required for the .pdf upload feature -- extracts text content from uploaded PDFs client-side. Heavy (~2MB) but necessary. Use dynamic import to avoid bloating initial bundle: `const pdfjs = await import('pdfjs-dist')` | HIGH |

**Note:** For .txt files, use the native `FileReader` API -- no library needed. Only PDF requires a library.

### Dev Dependencies

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vitest | ^4.0.18 | Unit/integration testing | Native Vite integration, Jest-compatible API, fast. Standard choice for Vite projects -- shares Vite's config and transform pipeline | HIGH |
| @testing-library/react | ^16.3.2 | Component testing | Standard React testing library. Tests components how users interact with them, not implementation details | HIGH |
| @testing-library/jest-dom | ^6.9.1 | DOM assertions | Adds `toBeInTheDocument()`, `toHaveClass()`, etc. Standard companion to Testing Library | HIGH |
| ESLint | ^9.x | Linting | Use flat config (eslint.config.js). Vite scaffolds this automatically with `npm create vite@latest` | HIGH |
| Prettier | ^3.8.1 | Code formatting | Consistent formatting. Use with eslint-config-prettier to avoid conflicts | HIGH |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| State management | Zustand | Redux Toolkit | Overkill for 2-3 small stores. PROJECT.md explicitly says no Redux |
| State management | Zustand | React Context | Causes unnecessary re-renders, no devtools, awkward with multiple stores |
| Styling | Tailwind CSS v4 | shadcn/ui | Would add complexity for a project that needs custom education-focused design. Hand-crafted Tailwind components give more control and are better for learning |
| Styling | Tailwind CSS v4 | CSS Modules | Tailwind is a project constraint. Utility-first is faster for prototyping |
| Icons | Lucide React | Heroicons | Both work fine. Lucide has a slightly larger set and cleaner React API |
| Icons | Lucide React | React Icons | React Icons bundles everything -- not tree-shakeable by default, larger bundle |
| HTTP | Axios | fetch | Axios is a project constraint. Interceptors and transforms will be useful for backend integration |
| Routing | React Router v6 | TanStack Router | Project constrains to React Router v6. TanStack Router is type-safe but adds learning curve |
| Build tool | Vite | Next.js | This is a pure SPA -- no SSR, no API routes needed. Vite is simpler and the project constraint |
| File upload | react-dropzone | Custom implementation | react-dropzone handles edge cases (accessibility, multiple files, type validation) that are tedious to build from scratch |
| PDF parsing | pdfjs-dist | pdf-parse | pdf-parse is Node.js only. pdfjs-dist works in the browser |
| Testing | Vitest | Jest | Jest requires separate config for ESM/TypeScript. Vitest is the standard for Vite projects |
| Toasts | sonner | react-hot-toast | Both are good. Sonner has better defaults and newer API |
| Animation | CSS transitions | Framer Motion | Framer Motion (12.35.1) is 32KB+. CSS transitions and Tailwind's `transition-*` classes handle everything this project needs (collapsible sections, loading states, hover effects). Only add Framer Motion if you need complex orchestrated animations |

## What NOT to Use

| Library | Why Not |
|---------|---------|
| Redux / Redux Toolkit | Project explicitly excludes it. Zustand is the right tool at this scale |
| Next.js | Pure SPA with mock data. No SSR/SSG benefits. Would add unnecessary complexity |
| Material UI / Ant Design / Chakra UI | Heavy component libraries that impose their design language. This project needs a custom education-focused aesthetic -- build it with Tailwind |
| Framer Motion | Unnecessary weight. CSS transitions cover all the animation needs here |
| React Query / TanStack Query | Overkill when all data is mocked. No real server state to cache/invalidate. Add it later when real backend is integrated |
| Formik / React Hook Form | The rubric editor and essay input are simple enough to handle with controlled components and Zustand. No complex validation rules |
| Storybook | Nice-to-have but scope creep for a course project. Build components in-context |

## Installation

```bash
# Initialize project
npm create vite@latest essay-grader -- --template react-ts
cd essay-grader

# Core dependencies
npm install react-router-dom@^6.30.3 zustand@^5.0.11 axios@^1.13.6

# UI utilities
npm install clsx@^2.1.1 tailwind-merge@^3.5.0 lucide-react@^0.577.0
npm install react-dropzone@^15.0.0 sonner@^2.0.7

# PDF processing (for .pdf file upload)
npm install pdfjs-dist@^5.5.207

# Tailwind v4 (Vite plugin -- replaces PostCSS approach)
npm install tailwindcss@^4.2.1 @tailwindcss/vite@^4.2.1

# Dev dependencies
npm install -D vitest@^4.0.18 @testing-library/react@^16.3.2 @testing-library/jest-dom@^6.9.1
```

### Tailwind v4 Setup (Different from v3)

Tailwind v4 setup is significantly different from v3. No `tailwind.config.js` needed.

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

**src/index.css:**
```css
@import "tailwindcss";
```

That is it. No PostCSS config, no content paths, no config file. Tailwind v4 auto-detects your source files.

### Utility Helper

Create `src/lib/utils.ts`:
```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## Key Version Notes

- **Tailwind v4 is a breaking change from v3.** CSS-first configuration replaces `tailwind.config.js`. If following v3 tutorials, the config approach will not work. Use `@import "tailwindcss"` not `@tailwind base; @tailwind components; @tailwind utilities;`.
- **React Router v6 vs v7:** The project specifies v6. Pin to `^6.30.3` to avoid accidentally upgrading to v7, which has a different API surface (merged with Remix).
- **React 19 is stable.** No concerns with any of the recommended libraries -- all support React 19.
- **Zustand v5** dropped the deprecated `create` without generic syntax. Use `create<StoreType>()((set) => ...)` pattern.

## Sources

- npm registry (direct version checks via `npm view`, verified 2026-03-08) -- HIGH confidence
- Tailwind CSS v4 setup: based on Tailwind v4 release notes and `@tailwindcss/vite` package existence -- HIGH confidence
- React Router v6/v7 split: verified via npm (v7.13.1 is latest, v6.30.3 is latest v6) -- HIGH confidence
- Library recommendations (Lucide, sonner, react-dropzone): based on ecosystem knowledge -- MEDIUM confidence, standard community choices
