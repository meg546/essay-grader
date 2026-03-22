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
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-3 rounded-xl p-6 transition-[color,box-shadow] focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-2 border-primary bg-primary/5"
          : "border border-border hover:border-primary/50"
      )}
    >
      <Icon aria-hidden="true" className="h-8 w-8 text-primary" />
      <span className="font-medium">{label}</span>
    </button>
  )
}
