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
  setCurrentResult: (result: GradingResult) => void;
  clearCurrentResult: () => void;
  setEssayText: (text: string) => void;
  setRubricFile: (file: File | null) => void;
  setRubricText: (text: string) => void;
  setTextSize: (size: TextSize) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentResult: null,
      essayText: "",
      rubricFile: null,
      rubricText: "",
      textSize: "normal",
      setCurrentResult: (result) => set({ currentResult: result }),
      clearCurrentResult: () => set({ currentResult: null }),
      setEssayText: (text) => set({ essayText: text }),
      setRubricFile: (file) =>
        set({ rubricFile: file, ...(file === null && { rubricText: "" }) }),
      setRubricText: (text) => set({ rubricText: text }),
      setTextSize: (size) => set({ textSize: size }),
    }),
    {
      name: "essay-grader-app",
      version: 3,
      migrate: (persisted, version) => {
        const state = persisted as Record<string, unknown>;
        if (version < 2) {
          return { ...state, history: undefined };
        }
        if (version < 3) {
          state.textSize = "normal";
        }
        return state;
      },
      partialize: (state) => ({ essayText: state.essayText, textSize: state.textSize }),
    }
  )
);
