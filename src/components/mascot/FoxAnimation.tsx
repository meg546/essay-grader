import { AnimatePresence, motion } from "motion/react";
import { useFoxStore } from "@/stores/fox-store";
import { FoxBase } from "./sprites";

const motionConfig = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { duration: 0.3 },
};

export function FoxAnimation() {
  const currentState = useFoxStore((s) => s.currentState);

  // Check reduced motion preference
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    return <FoxBase state={currentState} className="h-20 w-20" />;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div key={currentState} {...motionConfig}>
        <FoxBase state={currentState} className="h-20 w-20" />
      </motion.div>
    </AnimatePresence>
  );
}
