import { useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useFoxStore } from "@/stores/fox-store";

const AUTO_DISMISS_MS = 10_000;

export function SpeechBubble() {
  const text = useFoxStore((s) => s.speechBubbleText);
  const isVisible = useFoxStore((s) => s.isBubbleVisible);
  const dismiss = useFoxStore((s) => s.dismissBubble);

  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const hasFocusRef = useRef(false);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (!hasFocusRef.current) dismiss();
    }, AUTO_DISMISS_MS);
  }, [dismiss]);

  useEffect(() => {
    if (isVisible) startTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isVisible, startTimer]);

  const handleFocus = () => {
    hasFocusRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleBlur = () => {
    hasFocusRef.current = false;
    if (isVisible) startTimer();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") dismiss();
  };

  return (
    <AnimatePresence>
      {isVisible && text && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          role="status"
          aria-live="polite"
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          className="absolute bottom-full mb-2 right-0 max-w-[250px] rounded-xl bg-popover border border-border p-3 shadow-lg text-sm text-popover-foreground"
        >
          <button
            onClick={dismiss}
            aria-label="Dismiss tip"
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
          <p>{text}</p>
          {/* Tail pointing down */}
          <div className="absolute -bottom-2 right-6 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-popover" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
