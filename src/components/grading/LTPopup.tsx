import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Editor } from '@tiptap/react'
import { X } from 'lucide-react'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { ltPluginKey } from '@/extensions/LanguageTool'

interface PopupData {
  message: string
  replacements: string[]
  from: number
  to: number
  category: string
  anchorRect: DOMRect
}

function getCategoryDotClass(category: string): string {
  if (category === 'misspelling' || category === 'typographical') {
    return 'inline-block w-2 h-2 rounded-full bg-red-500 flex-shrink-0'
  }
  if (
    category === 'grammar' ||
    category === 'duplication' ||
    category === 'inconsistency'
  ) {
    return 'inline-block w-2 h-2 rounded-full bg-blue-500 flex-shrink-0'
  }
  if (
    category === 'style' ||
    category === 'locale-violation' ||
    category === 'register' ||
    category === 'formatting'
  ) {
    return 'inline-block w-2 h-2 rounded-full bg-amber-500 flex-shrink-0'
  }
  return 'inline-block w-2 h-2 rounded-full bg-blue-500 flex-shrink-0'
}

function getCategoryLabel(category: string): string {
  if (category === 'misspelling' || category === 'typographical') return 'Spelling'
  if (
    category === 'grammar' ||
    category === 'duplication' ||
    category === 'inconsistency'
  ) {
    return 'Grammar'
  }
  if (
    category === 'style' ||
    category === 'locale-violation' ||
    category === 'register' ||
    category === 'formatting'
  ) {
    return 'Style'
  }
  return 'Grammar'
}

interface LTPopupProps {
  editor: Editor | null
}

export function LTPopup({ editor }: LTPopupProps) {
  const [popupData, setPopupData] = useState<PopupData | null>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  // Click handler on editor DOM
  useEffect(() => {
    if (!editor) return

    const editorDom = editor.view.dom

    function handleEditorClick(event: MouseEvent) {
      const target = event.target as HTMLElement
      const decoration = target.closest('[data-lt-message]') as HTMLElement | null

      if (decoration) {
        const message = decoration.getAttribute('data-lt-message') ?? ''
        const replacementsRaw = decoration.getAttribute('data-lt-replacements') ?? '[]'
        const from = parseInt(decoration.getAttribute('data-lt-from') ?? '0', 10)
        const to = parseInt(decoration.getAttribute('data-lt-to') ?? '0', 10)
        const category = decoration.getAttribute('data-lt-category') ?? ''
        const anchorRect = decoration.getBoundingClientRect()

        let replacements: string[] = []
        try {
          replacements = JSON.parse(replacementsRaw)
        } catch {
          replacements = []
        }

        setPopupData({ message, replacements, from, to, category, anchorRect })
      } else {
        // Close only if click is not inside the popup
        if (popupRef.current && popupRef.current.contains(target)) {
          return
        }
        setPopupData(null)
      }
    }

    editorDom.addEventListener('click', handleEditorClick)
    return () => {
      editorDom.removeEventListener('click', handleEditorClick)
    }
  }, [editor])

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setPopupData(null)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Close on mousedown outside popup and outside editor decorations
  useEffect(() => {
    function handleMouseDown(event: MouseEvent) {
      if (!popupData) return
      const target = event.target as HTMLElement
      // Don't close if clicking inside popup
      if (popupRef.current && popupRef.current.contains(target)) return
      // Don't close if clicking on a decoration (editor click handler will handle it)
      if (target.closest('[data-lt-message]')) return
      setPopupData(null)
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [popupData])

  // Reposition on scroll
  useEffect(() => {
    if (!editor || !popupData) return

    const editorView = editor.view
    const scrollContainer =
      editorView.dom.closest('.overflow-y-auto') ?? editorView.dom.parentElement

    function handleScroll() {
      if (!popupData) return
      // Find the decoration span by from position
      const spans = editorView.dom.querySelectorAll('[data-lt-from]')
      for (const span of spans) {
        const spanFrom = parseInt((span as HTMLElement).getAttribute('data-lt-from') ?? '-1', 10)
        if (spanFrom === popupData.from) {
          const rect = span.getBoundingClientRect()
          // If element is not visible (off screen), close
          if (rect.bottom < 0 || rect.top > window.innerHeight) {
            setPopupData(null)
          } else {
            setPopupData((prev) => (prev ? { ...prev, anchorRect: rect } : null))
          }
          return
        }
      }
      // Element not found — close
      setPopupData(null)
    }

    scrollContainer?.addEventListener('scroll', handleScroll)
    return () => {
      scrollContainer?.removeEventListener('scroll', handleScroll)
    }
  }, [editor, popupData])

  function handleReplace(replacement: string) {
    if (!editor || !popupData) return
    const { from, to } = popupData
    editor
      .chain()
      .focus()
      .command(({ tr }) => {
        tr.replaceWith(from, to, editor.state.schema.text(replacement))
        return true
      })
      .run()
    setPopupData(null)
  }

  function handleDismiss() {
    if (!editor || !popupData) return
    const { from, to } = popupData
    const pluginState = ltPluginKey.getState(editor.state)
    if (pluginState) {
      const decos = pluginState.find(from, to)
      const newSet = pluginState.remove(decos)
      editor.view.dispatch(editor.state.tr.setMeta(ltPluginKey, newSet))
    }
    setPopupData(null)
  }

  if (!popupData) return null

  const { anchorRect, message, replacements, category } = popupData
  const dotClass = getCategoryDotClass(category)
  const categoryLabel = getCategoryLabel(category)
  const visibleReplacements = replacements.slice(0, 5)

  const popup = (
    <div
      ref={popupRef}
      style={{
        position: 'fixed',
        top: anchorRect.bottom + 4,
        left: anchorRect.left,
        zIndex: 50,
      }}
    >
      <Card size="sm" className="shadow-md w-72">
        <CardHeader className="pb-1 pt-2 px-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={dotClass} />
              <span className="text-xs font-medium text-muted-foreground capitalize">
                {categoryLabel}
              </span>
            </div>
            <button
              onClick={() => setPopupData(null)}
              className="text-muted-foreground hover:text-foreground transition-colors rounded p-0.5 hover:bg-muted"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-2">
          <p className="text-sm mb-2">{message}</p>
          {visibleReplacements.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {visibleReplacements.map((r) => (
                <button
                  key={r}
                  onClick={() => handleReplace(r)}
                  className="rounded-md border bg-muted/50 px-2 py-0.5 text-sm hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="px-3 py-1.5 justify-end">
          <button
            onClick={handleDismiss}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Dismiss
          </button>
        </CardFooter>
      </Card>
    </div>
  )

  return createPortal(popup, document.body)
}
