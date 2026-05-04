import { Timer, Pause, Play } from "lucide-react";
import { useTimer } from "@/hooks/useTimer";
import { formatRemainingTime } from "@/lib/time-utils";
import { useAppStore } from "@/stores/app-store";
import { cn } from "@/lib/utils";

export function TimerDisplay() {
  const { remainingMs, isRunning, isPaused } = useTimer();

  if (remainingMs === null) return null;

  const isUrgent = isRunning && remainingMs < 60_000;

  function handleTogglePause() {
    if (isRunning) {
      useAppStore.getState().pauseTimer();
    } else if (isPaused) {
      useAppStore.getState().resumeTimer();
    }
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 h-8 px-4 text-xs text-muted-foreground transition-colors duration-200 shrink-0",
        isUrgent && "text-destructive",
        isPaused && "opacity-70"
      )}
    >
      <Timer aria-hidden="true" className="h-3.5 w-3.5" />
      <span className="tabular-nums">{formatRemainingTime(remainingMs)}</span>
      <button
        onClick={handleTogglePause}
        className="ml-0.5 p-0.5 rounded hover:bg-muted-foreground/10 transition-colors focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={isRunning ? "Pause timer" : "Resume timer"}
      >
        {isRunning ? (
          <Pause className="h-3 w-3" />
        ) : (
          <Play className="h-3 w-3" />
        )}
      </button>
    </div>
  );
}
