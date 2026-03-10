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
        <h2 className="mb-10 text-center text-3xl font-bold tracking-tight text-foreground">
          How It Works
        </h2>
        <div className="flex flex-col items-center gap-8 md:flex-row md:gap-0">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center text-center md:px-4">
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
              {index < steps.length - 1 && (
                <div className="hidden h-px w-12 bg-border md:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  )
}
