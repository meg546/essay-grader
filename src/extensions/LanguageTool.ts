import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { Lint, Linter } from 'harper.js'

export const ltPluginKey = new PluginKey<DecorationSet>('languageTool')

let debounceTimer: ReturnType<typeof setTimeout>

// Module-level linter singleton — lazy-initialized on first lint call
let _linterPromise: Promise<Linter> | null = null
function getLinter(): Promise<Linter> {
  if (!_linterPromise) {
    _linterPromise = import('harper.js').then(({ LocalLinter, binaryInlined, Dialect }) => {
      return new LocalLinter({ binary: binaryInlined, dialect: Dialect.American })
    })
  }
  return _linterPromise
}

// --- Offset mapping ---

interface OffsetEntry {
  charOffset: number
  pmPos: number
}

function buildOffsetMap(doc: ProseMirrorNode): OffsetEntry[] {
  const map: OffsetEntry[] = []
  let charOffset = 0
  let seenFirstBlock = false

  doc.descendants((node, pos) => {
    if (node.isBlock) {
      if (seenFirstBlock) {
        // Add \n\n separator between blocks
        charOffset += 2
      }
      seenFirstBlock = true
    }
    if (node.isText && node.text) {
      map.push({ charOffset, pmPos: pos })
      charOffset += node.text.length
    }
  })

  return map
}

function ltOffsetToPmPos(offset: number, map: OffsetEntry[]): number {
  // Find the last entry where charOffset <= offset
  let result = map[0]
  for (let i = map.length - 1; i >= 0; i--) {
    if (map[i].charOffset <= offset) {
      result = map[i]
      break
    }
  }
  if (!result) return offset
  return result.pmPos + (offset - result.charOffset)
}

// --- Word boundary snapping ---

function isWordChar(ch: string): boolean {
  return /[\w'\u2019-]/.test(ch)
}

function snapToWordBounds(
  text: string,
  offset: number,
  length: number
): { offset: number; length: number } {
  let start = offset
  let end = offset + length

  // Expand backward to start of word
  while (start > 0 && isWordChar(text[start - 1])) start--
  // Expand forward to end of word
  while (end < text.length && isWordChar(text[end])) end++

  return { offset: start, length: end - start }
}

// --- Decoration building ---

function getCssClass(lintKind: string): string {
  if (lintKind === 'Spelling') {
    return 'lt-misspelling'
  }
  if (
    lintKind === 'Repetition' ||
    lintKind === 'WordChoice' ||
    lintKind === 'Capitalization' ||
    lintKind === 'Sentence'
  ) {
    return 'lt-grammar'
  }
  if (lintKind === 'Readability' || lintKind === 'Formatting') {
    return 'lt-style'
  }
  return 'lt-grammar'
}

function getCategoryFromLintKind(lintKind: string): string {
  if (lintKind === 'Spelling') return 'spelling'
  if (
    lintKind === 'Repetition' ||
    lintKind === 'WordChoice' ||
    lintKind === 'Capitalization' ||
    lintKind === 'Sentence'
  ) {
    return 'grammar'
  }
  if (lintKind === 'Readability' || lintKind === 'Formatting') return 'style'
  return 'grammar'
}

function buildDecorations(doc: ProseMirrorNode, _text: string, lints: Lint[]): DecorationSet {
  const map = buildOffsetMap(doc)
  const decorations: Decoration[] = []

  for (const lint of lints) {
    const span = lint.span()
    const snapped = snapToWordBounds(_text, span.start, span.end - span.start)
    const from = ltOffsetToPmPos(snapped.offset, map)
    const to = ltOffsetToPmPos(snapped.offset + snapped.length, map)

    if (from >= to) continue

    // Skip decorations that cross block (paragraph) boundaries. When a lint
    // span straddles a paragraph boundary, ProseMirror clips the inline
    // decoration to each paragraph's end/start, causing the underline to
    // extend across the full paragraph width and appear as a red horizontal
    // bar between paragraphs.
    const $from = doc.resolve(from)
    const $to = doc.resolve(to)
    if ($from.parent !== $to.parent) continue

    const lintKind = lint.lint_kind() as string
    const cssClass = getCssClass(lintKind)
    const category = getCategoryFromLintKind(lintKind)

    const suggestions = lint.suggestions().map((s) => s.get_replacement_text())

    decorations.push(
      Decoration.inline(from, to, {
        class: cssClass,
        style: 'cursor: pointer',
        'data-lt-message': lint.message(),
        'data-lt-replacements': JSON.stringify(suggestions),
        'data-lt-from': String(from),
        'data-lt-to': String(to),
        'data-lt-category': category,
      })
    )
  }

  return DecorationSet.create(doc, decorations)
}

// --- Extension ---

export const LanguageToolExtension = Extension.create({
  name: 'languageTool',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: ltPluginKey,

        state: {
          init() {
            return DecorationSet.empty
          },

          apply(tr, oldSet) {
            const meta = tr.getMeta(ltPluginKey)
            if (meta !== undefined) {
              // New API result arriving via dispatch
              return meta as DecorationSet
            }

            if (tr.docChanged) {
              // If doc is now empty, clear all decorations (handles Clear button)
              if (tr.doc.textContent.length === 0) {
                return DecorationSet.empty
              }

              // Map old decorations to new doc positions; the debounced
              // re-lint will replace them with fresh results shortly.
              return oldSet.map(tr.mapping, tr.doc)
            }

            return oldSet
          },
        },

        props: {
          decorations(state) {
            return ltPluginKey.getState(state)
          },
        },
      }),
    ]
  },

  async onCreate({ editor }) {
    // Re-run linting when the editor initializes with pre-existing content
    // (e.g. essay text restored from Zustand persist on page reload).
    // onUpdate does not fire for the initial content set via the `content`
    // option, so we trigger a lint pass here if there is text to check.
    const text = editor.getText({ blockSeparator: '\n\n' })
    if (!text.trim()) return

    const linter = await getLinter()
    if (editor.isDestroyed) return
    const lints = await linter.lint(text)
    if (editor.isDestroyed) return
    const decorations = buildDecorations(editor.state.doc, text, lints)
    editor.view.dispatch(editor.state.tr.setMeta(ltPluginKey, decorations))
  },

  onUpdate({ editor }) {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(async () => {
      if (editor.isDestroyed) return

      const text = editor.getText({ blockSeparator: '\n\n' })

      if (!text.trim()) {
        editor.view.dispatch(
          editor.state.tr.setMeta(ltPluginKey, DecorationSet.empty)
        )
        return
      }

      const linter = await getLinter()
      const lints = await linter.lint(text)

      if (editor.isDestroyed) return // Check again after async (Pitfall 3)

      const decorations = buildDecorations(editor.state.doc, text, lints)
      editor.view.dispatch(editor.state.tr.setMeta(ltPluginKey, decorations))
    }, 300)
  },

  onDestroy() {
    clearTimeout(debounceTimer)
  },
})
