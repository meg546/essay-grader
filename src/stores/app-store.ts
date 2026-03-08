import { create } from "zustand";
import type { GradingResult } from "@/api/types";

interface AppState {
  currentResult: GradingResult | null;
  history: GradingResult[];
  setCurrentResult: (result: GradingResult) => void;
  addToHistory: (result: GradingResult) => void;
  clearCurrentResult: () => void;
}

export const useAppStore = create<AppState>()((set) => ({
  currentResult: null,
  history: [],
  setCurrentResult: (result) => set({ currentResult: result }),
  addToHistory: (result) =>
    set((state) => ({ history: [result, ...state.history] })),
  clearCurrentResult: () => set({ currentResult: null }),
}));
