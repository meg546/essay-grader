import { memo, useEffect, useRef } from "react";
import { useFoxStore } from "@/stores/fox-store";
import { useFoxCoach } from "./use-fox-coach";
import { FoxAnimation } from "./FoxAnimation";
import { SpeechBubble } from "./SpeechBubble";

const LAST_VISIT_KEY = "redpen-last-visit";

export const FoxCompanion = memo(function FoxCompanion() {
  const isHidden = useFoxStore((s) => s.isHidden);
  const isBubbleVisible = useFoxStore((s) => s.isBubbleVisible);
  const dismissBubble = useFoxStore((s) => s.dismissBubble);
  const currentState = useFoxStore((s) => s.currentState);
  const setFoxState = useFoxStore((s) => s.setFoxState);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const { requestTip } = useFoxCoach();

  useEffect(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    if (currentState === "idle") {
      idleTimerRef.current = setTimeout(() => {
        setFoxState("sleepy");
        // Nudge with a coaching tip after going sleepy (per spec)
        setTimeout(() => requestTip("idle_nudge"), 2000);
      }, 120_000); // 2 minutes
    }

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [currentState, setFoxState, requestTip]);

  // Daily greeting — show on first visit of the day
  useEffect(() => {
    const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
    const today = new Date().toDateString();

    if (lastVisit !== today) {
      localStorage.setItem(LAST_VISIT_KEY, today);
      // Delay greeting slightly so the page settles
      const timer = setTimeout(() => {
        requestTip("greeting");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [requestTip]);

  if (isHidden) return null;

  const handleClick = () => {
    if (isBubbleVisible) {
      dismissBubble();
    } else {
      requestTip("on_demand");
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
