import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectableCardProps {
  icon: LucideIcon
  label: string
  selected: boolean
  onClick: () => void
}

export function SelectableCard({ icon: Icon, label, selected, onClick }: SelectableCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-3 rounded-xl p-6 transition-all",
        selected
          ? "border-2 border-primary bg-primary/5"
          : "border border-border hover:border-primary/50"
      )}
    >
      <Icon className="h-8 w-8 text-primary" />
      <span className="font-medium">{label}</span>
    </button>
  )
}
