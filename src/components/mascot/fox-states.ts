export type FoxState =
  | "idle"
  | "attentive"
  | "thinking"
  | "celebrating"
  | "encouraging"
  | "coaching"
  | "sleepy"
  | "browsing"
  | "waving";

/** States that auto-transition back to idle after a duration */
export const TIMED_STATES: Partial<Record<FoxState, number>> = {
  celebrating: 3000,
  encouraging: 3000,
};

/** Whether a state can be interrupted by a new state */
export function canTransition(from: FoxState, to: FoxState): boolean {
  // Thinking can only be interrupted by result states
  if (from === "thinking") {
    return ["celebrating", "encouraging", "coaching", "idle"].includes(to);
  }
  return true;
}
