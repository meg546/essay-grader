import { memo, useEffect, useRef } from "react";
import { useFoxStore } from "@/stores/fox-store";
import { FoxAnimation } from "./FoxAnimation";
import { SpeechBubble } from "./SpeechBubble";

export const FoxCompanion = memo(function FoxCompanion() {
  const isHidden = useFoxStore((s) => s.isHidden);
  const isBubbleVisible = useFoxStore((s) => s.isBubbleVisible);
  const dismissBubble = useFoxStore((s) => s.dismissBubble);
  const showCoachingTip = useFoxStore((s) => s.showCoachingTip);
  const currentState = useFoxStore((s) => s.currentState);
  const setFoxState = useFoxStore((s) => s.setFoxState);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    if (currentState === "idle") {
      idleTimerRef.current = setTimeout(() => {
        setFoxState("sleepy");
        // Nudge with a coaching tip after going sleepy (per spec)
        setTimeout(() => {
          // requestTip("idle_nudge") — will be wired in Task 26
          showCoachingTip("Looks like you've been away. Ready to grade an essay?");
        }, 2000);
      }, 120_000); // 2 minutes
    }

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [currentState, setFoxState, showCoachingTip]);

  if (isHidden) return null;

  const handleClick = () => {
    if (isBubbleVisible) {
      dismissBubble();
    } else {
      // On-demand coaching will be wired up in the coaching task
      // For now, clicking toggles a placeholder message
      showCoachingTip("Click me after grading for personalized tips!");
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="relative">
        <SpeechBubble />
        <button
          onClick={handleClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleClick();
            }
          }}
          aria-label="Fox companion — click for writing tips"
          className="block cursor-pointer rounded-full p-1 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <FoxAnimation />
        </button>
      </div>
    </div>
  );
});
