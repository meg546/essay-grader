import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { Linter } from 'harper.js'

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
  // Default
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildDecorations(doc: ProseMirrorNode, _text: string, lints: any[]): DecorationSet {
  const map = buildOffsetMap(doc)
  const decorations: Decoration[] = []

  for (const lint of lints) {
    const span = lint.span() as { start: number; end: number }
    const snapped = snapToWordBounds(_text, span.start, span.end - span.start)
    const from = ltOffsetToPmPos(snapped.offset, map)
    const to = ltOffsetToPmPos(snapped.offset + snapped.length, map)

    if (from >= to) continue

    const lintKind = lint.lint_kind() as string
    const cssClass = getCssClass(lintKind)
    const category = getCategoryFromLintKind(lintKind)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const suggestions = (lint.suggestions() as any[]).map((s: any) =>
      s.get_replacement_text()
    )

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

              // Map old decorations to new doc positions FIRST
              const mapped = oldSet.map(tr.mapping, tr.doc)

              // Find the block containing the cursor (in new doc)
              const $pos = tr.doc.resolve(tr.selection.from)

              // Get start/end of the block node at this position
              let blockStart: number
              let blockEnd: number

              if ($pos.depth > 0) {
                blockStart = $pos.start($pos.depth)
                blockEnd = $pos.end($pos.depth)
              } else {
                blockStart = 0
                blockEnd = tr.doc.content.size
              }

              // Remove decorations only in the touched block (now using new-doc positions)
              return mapped.remove(mapped.find(blockStart, blockEnd))
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
