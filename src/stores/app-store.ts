import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GradingResult } from "@/api/types";

export type TextSize = "small" | "normal" | "large";

interface AppState {
  currentResult: GradingResult | null;
  essayText: string;
  rubricFile: File | null;
  rubricText: string;
  textSize: TextSize;
  timerEndTime: number | null;
  timerPaused: boolean;
  timerRemainingMs: number | null;
  setCurrentResult: (result: GradingResult) => void;
  clearCurrentResult: () => void;
  setEssayText: (text: string) => void;
  setRubricFile: (file: File | null) => void;
  setRubricText: (text: string) => void;
  setTextSize: (size: TextSize) => void;
  startTimer: (durationMs: number) => void;
  cancelTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  updateTimerDuration: (durationMs: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentResult: null,
      essayText: "",
      rubricFile: null,
      rubricText: "",
      textSize: "normal",
      timerEndTime: null,
      timerPaused: false,
      timerRemainingMs: null,
      setCurrentResult: (result) => set({ currentResult: result }),
      clearCurrentResult: () => set({ currentResult: null }),
      setEssayText: (text) => set({ essayText: text }),
      setRubricFile: (file) =>
        set({ rubricFile: file, ...(file === null && { rubricText: "" }) }),
      setRubricText: (text) => set({ rubricText: text }),
      setTextSize: (size) => set({ textSize: size }),
      startTimer: (durationMs) =>
        set({
          timerEndTime: Date.now() + durationMs,
          timerPaused: false,
          timerRemainingMs: null,
        }),
      cancelTimer: () =>
        set({
          timerEndTime: null,
          timerPaused: false,
          timerRemainingMs: null,
        }),
      pauseTimer: () => {
        const { timerEndTime } = get();
        if (timerEndTime === null) return;
        set({
          timerRemainingMs: Math.max(0, timerEndTime - Date.now()),
          timerEndTime: null,
          timerPaused: true,
        });
      },
      resumeTimer: () => {
        const { timerRemainingMs } = get();
        if (timerRemainingMs === null) return;
        set({
          timerEndTime: Date.now() + timerRemainingMs,
          timerPaused: false,
          timerRemainingMs: null,
        });
      },
      updateTimerDuration: (durationMs) =>
        set({
          timerEndTime: Date.now() + durationMs,
          timerPaused: false,
          timerRemainingMs: null,
        }),
    }),
    {
      name: "essay-grader-app",
      version: 4,
      migrate: (persisted, version) => {
        const state = persisted as Record<string, unknown>;
        if (version < 2) {
          return { ...state, history: undefined };
        }
        if (version < 3) {
          state.textSize = "normal";
        }
        if (version < 4) {
          state.timerEndTime = null;
          state.timerPaused = false;
          state.timerRemainingMs = null;
        }
        return state;
      },
      partialize: (state) => ({
        essayText: state.essayText,
        textSize: state.textSize,
        timerEndTime: state.timerEndTime,
        timerPaused: state.timerPaused,
        timerRemainingMs: state.timerRemainingMs,
      }),
    }
  )
);
