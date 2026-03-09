import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export interface HighlightContextValue {
  activeCategoryId: string | null;
  setActiveCategoryId: (id: string | null) => void;
  disabledCategories: Set<string>;
  toggleCategory: (categoryId: string) => void;
  scrollTarget: string | null;
  setScrollTarget: (target: string | null) => void;
}

const HighlightContext = createContext<HighlightContextValue | null>(null);

export function HighlightProvider({ children }: { children: ReactNode }) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [disabledCategories, setDisabledCategories] = useState<Set<string>>(
    () => new Set(),
  );
  const [scrollTarget, setScrollTarget] = useState<string | null>(null);

  const toggleCategory = useCallback((categoryId: string) => {
    setDisabledCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  return (
    <HighlightContext.Provider
      value={{
        activeCategoryId,
        setActiveCategoryId,
        disabledCategories,
        toggleCategory,
        scrollTarget,
        setScrollTarget,
      }}
    >
      {children}
    </HighlightContext.Provider>
  );
}

export function useHighlightContext(): HighlightContextValue {
  const ctx = useContext(HighlightContext);
  if (!ctx) {
    throw new Error(
      "useHighlightContext must be used within a <HighlightProvider>",
    );
  }
  return ctx;
}
