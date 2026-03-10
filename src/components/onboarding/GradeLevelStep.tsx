import { useState } from "react"
import { BookOpen, School, Building2, GraduationCap, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { SelectableCard } from "./SelectableCard"
import { updateProfile } from "@/api/auth"
import {
  useProfileStore,
  GRADE_LEVEL_LABELS,
  type GradeLevel,
} from "@/stores/profile-store"
import type { LucideIcon } from "lucide-react"

const OPTIONS: { value: GradeLevel; icon: LucideIcon }[] = [
  { value: "elementary", icon: BookOpen },
  { value: "middle-school", icon: School },
  { value: "high-school", icon: Building2 },
  { value: "college", icon: GraduationCap },
]

interface GradeLevelStepProps {
  onNext: () => void
  onBack: () => void
}

export function GradeLevelStep({ onNext, onBack }: GradeLevelStepProps) {
  const [selected, setSelected] = useState<GradeLevel | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleNext() {
    if (!selected) return
    setSaving(true)
    useProfileStore.getState().setGradeLevel(selected)
    try {
      await updateProfile({ gradeLevel: selected })
    } catch {
      toast.error("Could not save preference. You can update this later.")
    } finally {
      setSaving(false)
      onNext()
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">What grade level do you teach or study?</h2>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {OPTIONS.map((opt) => (
          <SelectableCard
            key={opt.value}
            icon={opt.icon}
            label={GRADE_LEVEL_LABELS[opt.value]}
            selected={selected === opt.value}
            onClick={() => setSelected(opt.value)}
          />
        ))}
      </div>
      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack} disabled={saving}>
          Back
        </Button>
        <Button onClick={handleNext} disabled={!selected || saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Next"
          )}
        </Button>
      </div>
    </div>
  )
}
