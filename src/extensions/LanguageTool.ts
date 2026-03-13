import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { checkText } from '@/api/languagetool'
import type { LTMatch } from '@/api/languagetool'

export const ltPluginKey = new PluginKey<DecorationSet>('languageTool')

let debounceTimer: ReturnType<typeof setTimeout>

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

// --- Decoration building ---

function getCssClass(issueType: string): string {
  const type = issueType.toLowerCase()
  if (type === 'misspelling' || type === 'typographical') {
    return 'lt-misspelling'
  }
  if (type === 'grammar' || type === 'duplication' || type === 'inconsistency') {
    return 'lt-grammar'
  }
  if (
    type === 'style' ||
    type === 'locale-violation' ||
    type === 'register' ||
    type === 'formatting'
  ) {
    return 'lt-style'
  }
  // Default
  return 'lt-grammar'
}

function buildDecorations(
  doc: ProseMirrorNode,
  _text: string,
  matches: LTMatch[]
): DecorationSet {
  const map = buildOffsetMap(doc)
  const decorations: Decoration[] = []

  for (const match of matches) {
    const from = ltOffsetToPmPos(match.offset, map)
    const to = ltOffsetToPmPos(match.offset + match.length, map)

    if (from >= to) continue

    const cssClass = getCssClass(match.rule.issueType)

    decorations.push(
      Decoration.inline(from, to, {
        class: cssClass,
        'data-lt-message': match.message,
        'data-lt-replacements': JSON.stringify(match.replacements.map((r) => r.value)),
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

              // Find the block containing the cursor
              const $pos = tr.doc.resolve(tr.selection.from)

              // Get start/end of the block node at this position
              let blockStart: number
              let blockEnd: number

              if ($pos.depth > 0) {
                blockStart = $pos.start($pos.depth)
                blockEnd = $pos.end($pos.depth)
              } else {
                // At top level — use position 0 to full doc size
                blockStart = 0
                blockEnd = tr.doc.content.size
              }

              // Remove decorations only in the touched block
              const clearedSet = oldSet.remove(oldSet.find(blockStart, blockEnd))
              // Map remaining decorations through the transaction
              return clearedSet.map(tr.mapping, tr.doc)
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

      const matches = await checkText(text)

      if (editor.isDestroyed) return // Check again after async (Pitfall 3)

      const decorations = buildDecorations(editor.state.doc, text, matches)
      editor.view.dispatch(editor.state.tr.setMeta(ltPluginKey, decorations))
    }, 3000)
  },

  onDestroy() {
    clearTimeout(debounceTimer)
  },
})
