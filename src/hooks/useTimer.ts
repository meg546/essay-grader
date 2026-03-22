import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/stores/app-store";

export function formatRemainingTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");
    return `${hours}:${mm}:${ss}`;
  }

  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function useTimer() {
  const timerEndTime = useAppStore((s) => s.timerEndTime);
  const timerPaused = useAppStore((s) => s.timerPaused);
  const timerRemainingMs = useAppStore((s) => s.timerRemainingMs);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const firedRef = useRef(false);
  const [, setTick] = useState(0);

  // On mount: detect timer that expired while the tab was closed — cancel silently
  useEffect(() => {
    if (timerEndTime !== null && !timerPaused && timerEndTime < Date.now()) {
      useAppStore.getState().cancelTimer();
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manage the countdown interval
  useEffect(() => {
    if (!timerEndTime || timerPaused) {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Reset fired ref when timer is not running
      firedRef.current = false;
      return;
    }

    firedRef.current = false;

    intervalRef.current = setInterval(() => {
      const remaining = useAppStore.getState().timerEndTime;
      if (remaining === null) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        return;
      }
      const diff = remaining - Date.now();
      if (diff <= 0 && !firedRef.current) {
        firedRef.current = true;
        useAppStore.getState().cancelTimer();
        toast("Time's up!");
        if (intervalRef.current !== null) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
      // Force re-render so remainingMs updates each second
      setTick((t) => t + 1);
    }, 1000);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timerEndTime, timerPaused]);

  const isRunning = timerEndTime !== null && !timerPaused;
  const isPaused = timerPaused;

  let remainingMs: number | null = null;
  if (isPaused) {
    remainingMs = timerRemainingMs;
  } else if (isRunning && timerEndTime !== null) {
    remainingMs = Math.max(0, timerEndTime - Date.now());
  }

  return { remainingMs, isRunning, isPaused };
}
