import { motion } from "motion/react"
import { Link } from "react-router"
import { PenTool } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"

interface HeroSectionProps {
  onSignIn: () => void
}

export function HeroSection({ onSignIn }: HeroSectionProps) {
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
          <Link to="/register" className={buttonVariants({ size: "lg", variant: "outline" })}>
            Register
          </Link>
        </div>
      </motion.div>
    </section>
  )
}
