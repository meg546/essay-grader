import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Card } from "@/components/ui/card"

const ESSAY_LINES = [
  "The industrial revolution fundamentally transformed",
  "society in ways that continue to shape our world",
  "today. Beginning in the late 18th century, this",
  "period saw unprecedented changes in manufacturing,",
  "transportation, and social structures…",
]

const RUBRIC_CRITERIA = [
  { name: "Thesis & Argument", weight: "30%", description: "Clear, defensible claim with logical reasoning" },
  { name: "Evidence", weight: "25%", description: "Relevant sources cited and analyzed" },
  { name: "Organization", weight: "25%", description: "Logical flow with transitions between ideas" },
  { name: "Grammar", weight: "20%", description: "Proper mechanics and academic tone" },
]

const SCORES = [
  { label: "Thesis & Argument", score: 92, color: "bg-emerald-500" },
  { label: "Evidence", score: 78, color: "bg-amber-500" },
  { label: "Organization", score: 85, color: "bg-emerald-500" },
  { label: "Grammar", score: 90, color: "bg-emerald-500" },
]

const TOTAL_DURATION = 15000
const FRAME_1_END = 4000
const FRAME_2_END = 8000
const FRAME_3_END = 11000

type DemoFrame = 1 | 2 | 3 | 4

function useFrameLoop(isInView: boolean) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!isInView) return

    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 100
        if (next >= TOTAL_DURATION) {
          return 0
        }
        return next
      })
    }, 100)

    return () => clearInterval(interval)
  }, [isInView])

  const frame: DemoFrame =
    elapsed < FRAME_1_END ? 1 :
    elapsed < FRAME_2_END ? 2 :
    elapsed < FRAME_3_END ? 3 : 4

  return { frame, elapsed }
}

export function WalkthroughDemo() {
  const [isInView, setIsInView] = useState(false)
  const { frame, elapsed } = useFrameLoop(isInView)

  const handleViewportEnter = useCallback(() => setIsInView(true), [])
  const handleViewportLeave = useCallback(() => setIsInView(false), [])

  return (
    <motion.section
      className="py-16"
      onViewportEnter={handleViewportEnter}
      onViewportLeave={handleViewportLeave}
      viewport={{ margin: "-100px" }}
    >
      <div className="mx-auto max-w-4xl px-4">
        <h2 className="mb-10 text-center text-3xl font-bold tracking-tight text-foreground text-balance">
          See It In Action
        </h2>
        <Card className="overflow-hidden">
          <div className="relative min-h-[280px] p-6">
            {/* Step indicator */}
            <div className="mb-4 flex gap-2" role="group" aria-label={`Step ${frame} of 4`}>
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-1 flex-1 rounded-full transition-opacity duration-300 ${
                    step <= frame ? "bg-primary" : "bg-border"
                  }`}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {frame === 1 && (
                <FrameEssay key="essay" elapsed={elapsed} />
              )}
              {frame === 2 && <FrameRubric key="rubric" />}
              {frame === 3 && <FrameGrading key="grading" />}
              {frame === 4 && <FrameResults key="results" />}
            </AnimatePresence>
          </div>
        </Card>
      </div>
    </motion.section>
  )
}

function FrameEssay({ elapsed }: { elapsed: number }) {
  const progress = Math.min(elapsed / FRAME_1_END, 1)
  const visibleLines = Math.ceil(progress * ESSAY_LINES.length)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Paste your essay
      </p>
      <div className="rounded-lg border border-border bg-background p-4 font-mono text-sm text-foreground">
        {ESSAY_LINES.slice(0, visibleLines).map((line, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {line}{" "}
          </motion.span>
        ))}
        <motion.span
          className="inline-block h-4 w-0.5 bg-primary"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
        />
      </div>
    </motion.div>
  )
}

function FrameRubric() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Add your rubric
      </p>
      <div className="space-y-2">
        {RUBRIC_CRITERIA.map((criterion, i) => (
          <motion.div
            key={criterion.name}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.15 }}
          >
            <motion.div
              className="flex size-5 items-center justify-center rounded border border-primary bg-primary/10"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2, delay: i * 0.15 + 0.2 }}
            >
              <svg aria-hidden="true" className="size-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-card-foreground">{criterion.name}</span>
                <span className="text-xs font-medium text-primary ml-2">{criterion.weight}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">{criterion.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function FrameGrading() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-6"
    >
      <p className="mb-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Analyzing essay{"\u2026"}
      </p>
      <div className="h-2 w-48 overflow-hidden rounded-full bg-border">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.3, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  )
}

function FrameResults() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Results
      </p>
      <div className="space-y-3">
        {SCORES.map((item, i) => (
          <motion.div
            key={item.label}
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
          >
            <span className="w-36 text-sm text-muted-foreground">
              {item.label}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
              <motion.div
                className={`h-full rounded-full ${item.color}`}
                initial={{ width: "0%" }}
                animate={{ width: `${item.score}%` }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
              />
            </div>
            <span className="w-8 text-right text-sm font-medium text-foreground tabular-nums">
              {item.score}
            </span>
          </motion.div>
        ))}
      </div>
      <motion.div
        className="mt-4 rounded-lg border border-border bg-background p-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-xs text-muted-foreground">
          <span className="rounded bg-emerald-500/20 px-1 text-emerald-600 dark:text-emerald-400">
            &quot;fundamentally transformed society&quot;
          </span>{" "}
          -- Strong thesis statement that clearly establishes the argument.
        </p>
      </motion.div>
    </motion.div>
  )
}
