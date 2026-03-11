import { useRef, useCallback } from "react";
import { getCoachingTip, type CoachContext } from "@/api/coach";
import { useFoxStore } from "@/stores/fox-store";
import { useProfileStore } from "@/stores/profile-store";

const DEBOUNCE_MS = 30_000;

export function useFoxCoach() {
  const showCoachingTip = useFoxStore((s) => s.showCoachingTip);
  const isSignedIn = useProfileStore((s) => s.isSignedIn);
  const lastCallRef = useRef(0);
  const cacheRef = useRef<Map<string, string>>(new Map());

  const requestTip = useCallback(
    async (context: CoachContext, submissionId?: string) => {
      if (!isSignedIn) return;

      // Debounce
      const now = Date.now();
      if (now - lastCallRef.current < DEBOUNCE_MS) return;

      // Check cache
      const cacheKey = `${context}:${submissionId ?? "none"}`;
      const cached = cacheRef.current.get(cacheKey);
      if (cached) {
        showCoachingTip(cached);
        return;
      }

      lastCallRef.current = now;

      try {
        const response = await getCoachingTip(context, submissionId);
        cacheRef.current.set(cacheKey, response.message);
        showCoachingTip(response.message);
      } catch {
        // Silently fail — fox just doesn't show a tip
      }
    },
    [isSignedIn, showCoachingTip]
  );

  return { requestTip };
}
