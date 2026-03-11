import { memo } from "react";
import { useFoxStore } from "@/stores/fox-store";
import { FoxAnimation } from "./FoxAnimation";
import { SpeechBubble } from "./SpeechBubble";

export const FoxCompanion = memo(function FoxCompanion() {
  const isHidden = useFoxStore((s) => s.isHidden);
  const isBubbleVisible = useFoxStore((s) => s.isBubbleVisible);
  const dismissBubble = useFoxStore((s) => s.dismissBubble);
  const showCoachingTip = useFoxStore((s) => s.showCoachingTip);

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
