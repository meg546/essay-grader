import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GradingResult } from "@/api/types";

interface AppState {
  currentResult: GradingResult | null;
  history: GradingResult[];
  essayText: string;
  rubricFile: File | null;
  rubricText: string;
  setCurrentResult: (result: GradingResult) => void;
  addToHistory: (result: GradingResult) => void;
  clearCurrentResult: () => void;
  setEssayText: (text: string) => void;
  setRubricFile: (file: File | null) => void;
  setRubricText: (text: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentResult: null,
      history: [],
      essayText: "",
      rubricFile: null,
      rubricText: "",
      setCurrentResult: (result) => set({ currentResult: result }),
      addToHistory: (result) =>
        set((state) => ({ history: [result, ...state.history] })),
      clearCurrentResult: () => set({ currentResult: null }),
      setEssayText: (text) => set({ essayText: text }),
      setRubricFile: (file) =>
        set({ rubricFile: file, ...(file === null && { rubricText: "" }) }),
      setRubricText: (text) => set({ rubricText: text }),
    }),
    {
      name: "essay-grader-app",
      partialize: (state) => ({ history: state.history }),
    }
  )
);
