import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WelcomeStepProps {
  onNext: () => void
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <Sparkles className="h-12 w-12 text-primary" />
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Welcome to EssayGrader!</h2>
        <p className="text-muted-foreground">Let's personalize your experience.</p>
      </div>
      <Button size="lg" onClick={onNext}>
        Let's Go
      </Button>
    </div>
  )
}
