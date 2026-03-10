import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { WizardProgress } from "./WizardProgress"
import { WelcomeStep } from "./WelcomeStep"
import { WritingPurposeStep } from "./WritingPurposeStep"
import { GradeLevelStep } from "./GradeLevelStep"
import { CompletionStep } from "./CompletionStep"

const TOTAL_STEPS = 4

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
}

export function RegistrationWizard() {
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)

  function goNext() {
    setDirection(1)
    setStep((s) => s + 1)
  }

  function goBack() {
    setDirection(-1)
    setStep((s) => s - 1)
  }

  return (
    <div className="mx-auto w-[75vw] max-w-3xl rounded-xl bg-card p-8 ring-1 ring-foreground/10 max-sm:w-full">
      <WizardProgress currentStep={step} totalSteps={TOTAL_STEPS} />
      <div className="mt-6 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {step === 0 && <WelcomeStep onNext={goNext} />}
            {step === 1 && (
              <WritingPurposeStep onNext={goNext} onSkip={goNext} />
            )}
            {step === 2 && <GradeLevelStep onNext={goNext} onBack={goBack} />}
            {step === 3 && <CompletionStep />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
