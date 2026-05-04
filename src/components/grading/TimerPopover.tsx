import { useState } from "react";
import { Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { useTimer } from "@/hooks/useTimer";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { ScrollPicker } from "./ScrollPicker";

const PRESETS = [
  { label: "15m", minutes: 15 },
  { label: "30m", minutes: 30 },
  { label: "45m", minutes: 45 },
  { label: "1h", minutes: 60 },
];

export function TimerPopover() {
  const [open, setOpen] = useState(false);
  const [selectedMinutes, setSelectedMinutes] = useState(15);

  const timerEndTime = useAppStore((s) => s.timerEndTime);
  const timerPaused = useAppStore((s) => s.timerPaused);
  const { remainingMs, isPaused } = useTimer();

  const isActive = timerEndTime !== null || timerPaused;

  // Derive current remaining minutes for the running picker display
  const remainingMinutes =
    remainingMs !== null ? Math.max(1, Math.ceil(remainingMs / 60_000)) : 1;

  // Separate state for the "running" picker so user can adjust without affecting selectedMinutes
  const [runningMinutes, setRunningMinutes] = useState<number | null>(null);
  const displayRunningMinutes = runningMinutes ?? remainingMinutes;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && isActive) {
      // Reset running picker to current remaining when opening
      setRunningMinutes(null);
    }
  }

  function handleStart() {
    useAppStore.getState().startTimer(selectedMinutes * 60_000);
    setOpen(false);
  }

  function handleSet() {
    useAppStore.getState().updateTimerDuration(displayRunningMinutes * 60_000);
    setRunningMinutes(null);
    setOpen(false);
  }

  function handleCancel() {
    useAppStore.getState().cancelTimer();
    setOpen(false);
  }

  function handleResume() {
    useAppStore.getState().resumeTimer();
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <PopoverTrigger
          render={
            <TooltipTrigger
              className={cn(
                "group relative flex items-center justify-center w-10 h-10 rounded-lg transition-[colors,transform] duration-150 hover:bg-primary/10 hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring cursor-pointer",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-primary"
              )}
            />
          }
        >
          <Timer
            aria-hidden="true"
            className="h-5 w-5 transition-[width,height] group-hover:h-[22px] group-hover:w-[22px]"
          />
          {isActive && (
            <span aria-hidden="true" className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${isPaused ? "bg-orange-500" : "bg-green-500"}`} />
          )}
        </PopoverTrigger>
        <TooltipContent>Timer</TooltipContent>
      </Tooltip>

      <PopoverContent side="left" align="start" className="w-48 p-3">
        {!isActive ? (
          /* Mode A: No timer running */
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium text-foreground">Set timer</p>

            {/* Preset buttons */}
            <div className="grid grid-cols-4 gap-1">
              {PRESETS.map(({ label, minutes }) => (
                <button
                  key={label}
                  onClick={() => setSelectedMinutes(minutes)}
                  className={cn(
                    "rounded-md px-1 py-1 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                    selectedMinutes === minutes
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Scroll picker */}
            <div className="overflow-hidden rounded-md border bg-muted/30">
              <ScrollPicker
                value={selectedMinutes}
                onChange={setSelectedMinutes}
              />
            </div>

            {/* Start button */}
            <button
              onClick={handleStart}
              className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus-visible:ring-2 focus-visible:ring-ring"
            >
              Start
            </button>
          </div>
        ) : (
          /* Mode B: Timer running or paused */
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium text-foreground">
              {isPaused ? "Timer paused" : "Timer running"}
            </p>

            {/* Running/paused picker */}
            <div className="overflow-hidden rounded-md border bg-muted/30">
              <ScrollPicker
                value={displayRunningMinutes}
                onChange={setRunningMinutes}
              />
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-1.5">
              {isPaused && (
                <button
                  onClick={handleResume}
                  className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Resume
                </button>
              )}
              {runningMinutes !== null && (
                <button
                  onClick={handleSet}
                  className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Set
                </button>
              )}
              <button
                onClick={handleCancel}
                className="w-full rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
