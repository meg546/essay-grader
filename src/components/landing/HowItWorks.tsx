import type React from "react"
import { motion } from "motion/react"

const steps = [
  {
    number: 1,
    title: "Paste Your Essay",
    description: "Type or paste your essay text, or upload a PDF file.",
  },
  {
    number: 2,
    title: "Add a Rubric",
    description: "Provide your grading rubric so feedback matches your criteria.",
  },
  {
    number: 3,
    title: "Get Feedback",
    description:
      "Receive rubric-aligned scores with highlighted passages instantly.",
  },
]

export function HowItWorks() {
  return (
    <motion.section
      className="py-16"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="mx-auto max-w-4xl px-4">
        <h2 className="mb-10 text-center text-3xl font-bold tracking-tight text-foreground text-balance">
          How It Works
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_auto_1fr_auto_1fr]  md:items-start md:gap-0">
          {steps.map((step, index) => (
            <div key={step.number} className="flex flex-col items-center text-center md:px-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                {step.number}
              </div>
              <h3 className="mt-4 font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 max-w-[200px] text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
          )).reduce<React.ReactNode[]>((acc, el, i) => {
            if (i > 0) {
              acc.push(
                <div key={`line-${i}`} className="hidden h-px mt-6 w-full bg-border md:block" />
              )
            }
            acc.push(el)
            return acc
          }, [])}
        </div>
      </div>
    </motion.section>
  )
}
