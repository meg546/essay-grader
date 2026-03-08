import { create } from "zustand";
import type { GradingResult } from "@/api/types";

interface AppState {
  currentResult: GradingResult | null;
  history: GradingResult[];
  essayText: string;
  rubricFile: File | null;
  setCurrentResult: (result: GradingResult) => void;
  addToHistory: (result: GradingResult) => void;
  clearCurrentResult: () => void;
  setEssayText: (text: string) => void;
  setRubricFile: (file: File | null) => void;
}

export const useAppStore = create<AppState>()((set) => ({
  currentResult: null,
  history: [],
  essayText: "",
  rubricFile: null,
  setCurrentResult: (result) => set({ currentResult: result }),
  addToHistory: (result) =>
    set((state) => ({ history: [result, ...state.history] })),
  clearCurrentResult: () => set({ currentResult: null }),
  setEssayText: (text) => set({ essayText: text }),
  setRubricFile: (file) => set({ rubricFile: file }),
}));
