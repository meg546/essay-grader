import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FoxState } from "@/components/mascot/fox-states";
import { canTransition, TIMED_STATES } from "@/components/mascot/fox-states";

interface FoxStore {
  currentState: FoxState;
  speechBubbleText: string;
  isBubbleVisible: boolean;
  isHidden: boolean;
  setFoxState: (state: FoxState) => void;
  showCoachingTip: (text: string) => void;
  dismissBubble: () => void;
  toggleHidden: () => void;
}

export const useFoxStore = create<FoxStore>()(
  persist(
    (set, get) => ({
      currentState: "idle" as FoxState,
      speechBubbleText: "",
      isBubbleVisible: false,
      isHidden: false,

      setFoxState: (state) => {
        const current = get().currentState;
        if (canTransition(current, state)) {
          set({ currentState: state });

          // Auto-transition back to idle for timed states
          const duration = TIMED_STATES[state];
          if (duration) {
            setTimeout(() => {
              if (get().currentState === state) {
                set({ currentState: "idle" });
              }
            }, duration);
          }
        }
      },

      showCoachingTip: (text) => {
        set({
          speechBubbleText: text,
          isBubbleVisible: true,
          currentState: "coaching",
        });
      },

      dismissBubble: () => {
        set({ isBubbleVisible: false, currentState: "idle" });
      },

      toggleHidden: () => {
        set((s) => ({ isHidden: !s.isHidden }));
      },
    }),
    {
      name: "fox-store",
      version: 1,
      partialize: (state) => ({ isHidden: state.isHidden }),
    }
  )
);
