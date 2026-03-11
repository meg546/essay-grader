import { motion } from "motion/react"
import { PenTool } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeroSectionProps {
  onSignIn: () => void
  onRegister: () => void
}

export function HeroSection({ onSignIn, onRegister }: HeroSectionProps) {
  return (
    <section className="py-24 md:py-32">
      <motion.div
        className="mx-auto max-w-3xl text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="mb-6 flex justify-center">
          <PenTool aria-hidden="true" className="size-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
          Get Instant, Rubric-Aligned Essay Feedback
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          Paste your essay, add a rubric, and receive detailed scores with
          highlighted passages in seconds. AI-powered grading that helps you
          improve.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Button size="lg" onClick={onSignIn}>
            Sign In
          </Button>
          <Button size="lg" variant="outline" onClick={onRegister}>
            Register
          </Button>
        </div>
      </motion.div>
    </section>
  )
}
