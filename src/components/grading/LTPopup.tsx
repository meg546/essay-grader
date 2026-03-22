import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Editor } from '@tiptap/react'
import { Loader2, X } from 'lucide-react'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { ltPluginKey } from '@/extensions/LanguageTool'
import { fetchSuggestions } from '@/api/suggestions'

interface PopupData {
  message: string
  replacements: string[]
  from: number
  to: number
  category: string
  anchorRect: DOMRect
}

type FetchState =
  | { status: 'loading' }
  | { status: 'loaded'; message: string; suggestions: string[] }
  | { status: 'error'; message: string }

function getCategoryDotClass(category: string): string {
  if (category === 'spelling') {
    return 'inline-block w-2 h-2 rounded-full bg-red-500 flex-shrink-0'
  }
  if (category === 'grammar') {
    return 'inline-block w-2 h-2 rounded-full bg-blue-500 flex-shrink-0'
  }
  if (category === 'style') {
    return 'inline-block w-2 h-2 rounded-full bg-amber-500 flex-shrink-0'
  }
  return 'inline-block w-2 h-2 rounded-full bg-blue-500 flex-shrink-0'
}

function getCategoryLabel(category: string): string {
  if (category === 'spelling') return 'Spelling'
  if (category === 'grammar') return 'Grammar'
  if (category === 'style') return 'Style'
  return 'Grammar'
}

function extractSentenceContext(editorText: string, flaggedText: string, maxLen = 200): string {
  const idx = editorText.indexOf(flaggedText)
  if (idx === -1) return flaggedText
  let start = idx
  while (start > 0 && !/[.!?\n]/.test(editorText[start - 1])) start--
  let end = idx + flaggedText.length
  while (end < editorText.length && !/[.!?\n]/.test(editorText[end])) end++
  const sentence = editorText.slice(start, end + 1).trim()
  return sentence.length > maxLen ? sentence.slice(0, maxLen) + '...' : sentence
}

interface LTPopupProps {
  editor: Editor | null
}

export function LTPopup({ editor }: LTPopupProps) {
  const [popupData, setPopupData] = useState<PopupData | null>(null)
  const [fetchState, setFetchState] = useState<FetchState | null>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const currentFromRef = useRef<number | null>(null)

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

        // Initiate async LLM fetch
        currentFromRef.current = from
        setFetchState({ status: 'loading' })

        const editorText = editor!.getText({ blockSeparator: '\n\n' })
        const flaggedText = decoration.textContent ?? ''
        const sentenceContext = extractSentenceContext(editorText, flaggedText)

        fetchSuggestions({ flaggedText, sentenceContext, category })
          .then((data) => {
            if (currentFromRef.current === from) {
              setFetchState({ status: 'loaded', message: data.message, suggestions: data.suggestions })
            }
          })
          .catch(() => {
            if (currentFromRef.current === from) {
              setFetchState({ status: 'error', message: 'Suggestions unavailable' })
            }
          })
      } else {
        // Close only if click is not inside the popup
        if (popupRef.current && popupRef.current.contains(target)) {
          return
        }
        setPopupData(null)
        setFetchState(null)
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
        setFetchState(null)
        currentFromRef.current = null
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
      setFetchState(null)
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
            setFetchState(null)
          } else {
            setPopupData((prev) => (prev ? { ...prev, anchorRect: rect } : null))
          }
          return
        }
      }
      // Element not found — close
      setPopupData(null)
      setFetchState(null)
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
    setFetchState(null)
    currentFromRef.current = null
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
    setFetchState(null)
    currentFromRef.current = null
  }

  if (!popupData) return null

  const { anchorRect, message, replacements, category } = popupData
  const dotClass = getCategoryDotClass(category)
  const categoryLabel = getCategoryLabel(category)

  // Get editor container bounds to avoid popup merging with container border
  const editorContainer = editor?.view.dom.closest('.border.rounded-lg') as HTMLElement | null
  const containerRect = editorContainer?.getBoundingClientRect()
  const insetPadding = 8 // px gap from editor container border

  // Viewport clamping — position below anchor, flip above if near bottom edge
  const popupHeight = 200
  const popupWidth = 288 // w-72 = 18rem

  // Clamp bottom edge: don't exceed editor container bottom or viewport
  const maxBottom = containerRect
    ? Math.min(containerRect.bottom - insetPadding, window.innerHeight)
    : window.innerHeight
  const top =
    anchorRect.bottom + 4 + popupHeight > maxBottom
      ? anchorRect.top - popupHeight - 4
      : anchorRect.bottom + 4

  // Clamp left edge: keep popup inside editor container and viewport
  const minLeft = containerRect ? containerRect.left + insetPadding : 0
  const maxLeft = containerRect
    ? Math.min(containerRect.right - popupWidth - insetPadding, window.innerWidth - popupWidth - 8)
    : window.innerWidth - popupWidth - 8
  const left = Math.max(minLeft, Math.min(anchorRect.left, maxLeft))

  const popup = (
    <div
      ref={popupRef}
      role="dialog"
      aria-label="Grammar suggestions"
      style={{
        position: 'fixed',
        top,
        left,
        zIndex: 50,
      }}
    >
      <Card size="sm" className="shadow-md w-72">
        <CardHeader className="pb-1 pt-2 px-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className={dotClass} />
              <span className="text-xs font-medium text-muted-foreground capitalize">
                {categoryLabel}
              </span>
            </div>
            <button
              onClick={() => {
                setPopupData(null)
                setFetchState(null)
                currentFromRef.current = null
              }}
              className="text-muted-foreground hover:text-foreground transition-colors rounded p-0.5 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Close"
            >
              <X aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          </div>
        </CardHeader>
        <CardContent aria-live="polite" className="px-3 pb-2">
          {fetchState?.status === 'loading' && (
            <>
              <p className="text-sm mb-2">{message}</p>
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
                <span>Getting suggestions{"\u2026"}</span>
              </div>
            </>
          )}
          {fetchState?.status === 'loaded' && (
            <>
              <p className="text-sm mb-2">{fetchState.message}</p>
              {fetchState.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {fetchState.suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleReplace(s)}
                      className="rounded-md border bg-muted/50 px-2 py-0.5 text-sm hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          {fetchState?.status === 'error' && (
            <>
              <p className="text-sm mb-2 text-muted-foreground">{fetchState.message}</p>
              {replacements.slice(0, 5).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {replacements.slice(0, 5).map((r) => (
                    <button
                      key={r}
                      onClick={() => handleReplace(r)}
                      className="rounded-md border bg-muted/50 px-2 py-0.5 text-sm hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          {fetchState === null && (
            <>
              <p className="text-sm mb-2">{message}</p>
              {replacements.slice(0, 5).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {replacements.slice(0, 5).map((r) => (
                    <button
                      key={r}
                      onClick={() => handleReplace(r)}
                      className="rounded-md border bg-muted/50 px-2 py-0.5 text-sm hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
        <CardFooter className="px-3 py-1.5 justify-end">
          <button
            onClick={handleDismiss}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          >
            Dismiss
          </button>
        </CardFooter>
      </Card>
    </div>
  )

  return createPortal(popup, document.body)
}
