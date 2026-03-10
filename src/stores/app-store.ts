import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GradingResult } from "@/api/types";

interface AppState {
  currentResult: GradingResult | null;
  essayText: string;
  rubricFile: File | null;
  rubricText: string;
  setCurrentResult: (result: GradingResult) => void;
  clearCurrentResult: () => void;
  setEssayText: (text: string) => void;
  setRubricFile: (file: File | null) => void;
  setRubricText: (text: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentResult: null,
      essayText: "",
      rubricFile: null,
      rubricText: "",
      setCurrentResult: (result) => set({ currentResult: result }),
      clearCurrentResult: () => set({ currentResult: null }),
      setEssayText: (text) => set({ essayText: text }),
      setRubricFile: (file) =>
        set({ rubricFile: file, ...(file === null && { rubricText: "" }) }),
      setRubricText: (text) => set({ rubricText: text }),
    }),
    {
      name: "essay-grader-app",
      version: 2,
      migrate: (persisted, version) => {
        if (version < 2) {
          const state = persisted as Record<string, unknown>;
          return { ...state, history: undefined };
        }
        return persisted;
      },
      partialize: (state) => ({ essayText: state.essayText }),
    }
  )
);
