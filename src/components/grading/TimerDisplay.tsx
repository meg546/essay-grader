import { Timer } from "lucide-react";
import { useTimer, formatRemainingTime } from "@/hooks/useTimer";
import { cn } from "@/lib/utils";

export function TimerDisplay() {
  const { remainingMs } = useTimer();

  if (remainingMs === null) return null;

  const isUrgent = remainingMs < 60_000;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 h-8 bg-muted/50 px-4 text-xs text-muted-foreground transition-colors duration-200 shrink-0",
        isUrgent && "text-destructive"
      )}
    >
      <Timer className="h-3.5 w-3.5" />
      <span>{formatRemainingTime(remainingMs)}</span>
    </div>
  );
}
