import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Card } from "@/components/ui/card"

const ESSAY_LINES = [
  "The industrial revolution fundamentally transformed",
  "society in ways that continue to shape our world",
  "today. Beginning in the late 18th century, this",
  "period saw unprecedented changes in manufacturing,",
  "transportation, and social structures...",
]

const RUBRIC_CRITERIA = ["Thesis & Argument", "Evidence", "Organization", "Grammar"]

const SCORES = [
  { label: "Thesis & Argument", score: 92, color: "bg-emerald-500" },
  { label: "Evidence", score: 78, color: "bg-amber-500" },
  { label: "Organization", score: 85, color: "bg-emerald-500" },
  { label: "Grammar", score: 90, color: "bg-emerald-500" },
]

const TOTAL_DURATION = 8000
const FRAME_1_END = 2000
const FRAME_2_END = 3500
const FRAME_3_END = 5000

type DemoFrame = 1 | 2 | 3 | 4

function useFrameLoop(isInView: boolean) {
  const [frame, setFrame] = useState<DemoFrame>(1)
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

  useEffect(() => {
    if (elapsed < FRAME_1_END) setFrame(1)
    else if (elapsed < FRAME_2_END) setFrame(2)
    else if (elapsed < FRAME_3_END) setFrame(3)
    else setFrame(4)
  }, [elapsed])

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
        <h2 className="mb-10 text-center text-3xl font-bold tracking-tight text-foreground">
          See It In Action
        </h2>
        <Card className="overflow-hidden">
          <div className="relative min-h-[280px] p-6">
            {/* Step indicator */}
            <div className="mb-4 flex gap-2">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
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
      <div className="flex flex-wrap gap-2">
        {RUBRIC_CRITERIA.map((criterion, i) => (
          <motion.div
            key={criterion}
            className="rounded-full border border-border bg-card px-3 py-1 text-sm text-card-foreground"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
          >
            {criterion}
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
        Analyzing essay...
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
            <span className="w-8 text-right text-sm font-medium text-foreground">
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
