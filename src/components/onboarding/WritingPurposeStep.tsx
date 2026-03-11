import { useState } from "react"
import { Briefcase, GraduationCap, Sparkles, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { SelectableCard } from "./SelectableCard"
import { updateProfile } from "@/api/auth"
import { useProfileStore, type WritingPurpose } from "@/stores/profile-store"

interface WritingPurposeStepProps {
  onNext: () => void
  onSkip: () => void
}

const OPTIONS: { value: WritingPurpose; label: string; icon: typeof Briefcase }[] = [
  { value: "work", label: "Work", icon: Briefcase },
  { value: "school", label: "School", icon: GraduationCap },
  { value: "other", label: "Other", icon: Sparkles },
]

export function WritingPurposeStep({ onNext, onSkip }: WritingPurposeStepProps) {
  const [selected, setSelected] = useState<WritingPurpose | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSelect(value: WritingPurpose) {
    setSelected(value)
    setSaving(true)
    useProfileStore.getState().setWritingPurpose(value)
    try {
      await updateProfile({ writingPurpose: value })
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
        <h2 className="text-2xl font-bold">What's your primary writing purpose?</h2>
      </div>
      <div className="flex gap-4">
        {OPTIONS.map((opt) => (
          <SelectableCard
            key={opt.value}
            icon={opt.icon}
            label={opt.label}
            selected={selected === opt.value}
            onClick={() => handleSelect(opt.value)}
          />
        ))}
      </div>
      {saving && <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin text-muted-foreground" />}
      <Button variant="ghost" onClick={onSkip} disabled={saving}>
        Skip for now
      </Button>
    </div>
  )
}
