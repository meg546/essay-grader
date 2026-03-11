import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

export function DemoReelVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion && videoRef.current) {
      videoRef.current.pause();
    }
  }, [prefersReducedMotion]);

  return (
    <motion.div
      className="mx-auto mt-14 max-w-4xl px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
    >
      <div className="overflow-hidden rounded-xl border border-border shadow-lg">
        <video
          ref={videoRef}
          autoPlay={!prefersReducedMotion}
          muted
          loop
          playsInline
          preload="metadata"
          className="block w-full"
          aria-label="Demo showing the essay grading workflow"
          poster="/demo-reel-poster.webp"
        >
          <source src="/demo-reel.mp4" type="video/mp4" />
        </video>
      </div>
    </motion.div>
  );
}
