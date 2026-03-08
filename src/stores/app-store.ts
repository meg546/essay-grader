import { create } from "zustand";
import type { GradingResult, RubricCategory } from "@/api/types";

export const ASAP_DEFAULT_RUBRIC: RubricCategory[] = [
  { name: "Content & Ideas", maxScore: 6 },
  { name: "Organization", maxScore: 6 },
  { name: "Style/Voice", maxScore: 6 },
  { name: "Language Conventions", maxScore: 6 },
];

interface AppState {
  currentResult: GradingResult | null;
  history: GradingResult[];
  essayText: string;
  rubricCategories: RubricCategory[];
  setCurrentResult: (result: GradingResult) => void;
  addToHistory: (result: GradingResult) => void;
  clearCurrentResult: () => void;
  setEssayText: (text: string) => void;
  setRubricCategories: (categories: RubricCategory[]) => void;
  updateCategory: (index: number, updates: Partial<RubricCategory>) => void;
  addCategory: () => void;
  removeCategory: (index: number) => void;
  resetRubric: () => void;
}

export const useAppStore = create<AppState>()((set) => ({
  currentResult: null,
  history: [],
  essayText: "",
  rubricCategories: ASAP_DEFAULT_RUBRIC.map((c) => ({ ...c })),
  setCurrentResult: (result) => set({ currentResult: result }),
  addToHistory: (result) =>
    set((state) => ({ history: [result, ...state.history] })),
  clearCurrentResult: () => set({ currentResult: null }),
  setEssayText: (text) => set({ essayText: text }),
  setRubricCategories: (categories) => set({ rubricCategories: categories }),
  updateCategory: (index, updates) =>
    set((state) => ({
      rubricCategories: state.rubricCategories.map((cat, i) =>
        i === index ? { ...cat, ...updates } : cat
      ),
    })),
  addCategory: () =>
    set((state) => ({
      rubricCategories: [
        ...state.rubricCategories,
        { name: "New Category", maxScore: 6 },
      ],
    })),
  removeCategory: (index) =>
    set((state) => ({
      rubricCategories: state.rubricCategories.filter((_, i) => i !== index),
    })),
  resetRubric: () =>
    set({ rubricCategories: ASAP_DEFAULT_RUBRIC.map((c) => ({ ...c })) }),
}));
