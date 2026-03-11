// src/components/mascot/sprites/FoxBase.tsx
import type { FoxState } from "../fox-states";

interface FoxBaseProps {
  state: FoxState;
  className?: string;
}

/**
 * Placeholder fox SVG — a simple rounded fox shape with expressions.
 * Replace with designer artwork or Lottie animations later.
 */
export function FoxBase({ state, className }: FoxBaseProps) {
  const eyeVariants: Record<FoxState, { leftEye: string; rightEye: string }> = {
    idle: { leftEye: "open", rightEye: "open" },
    attentive: { leftEye: "wide", rightEye: "wide" },
    thinking: { leftEye: "squint", rightEye: "open" },
    celebrating: { leftEye: "happy", rightEye: "happy" },
    encouraging: { leftEye: "soft", rightEye: "soft" },
    coaching: { leftEye: "open", rightEye: "open" },
    sleepy: { leftEye: "closed", rightEye: "closed" },
    browsing: { leftEye: "open", rightEye: "down" },
    waving: { leftEye: "happy", rightEye: "happy" },
  };

  const eyes = eyeVariants[state];

  // Simple rounded fox face SVG
  return (
    <svg
      viewBox="0 0 80 80"
      className={className}
      role="img"
      aria-label={`Fox mascot — ${state}`}
    >
      {/* Ears */}
      <polygon points="15,30 25,5 35,28" fill="#D4652A" />
      <polygon points="45,28 55,5 65,30" fill="#D4652A" />
      <polygon points="19,28 25,12 31,27" fill="#F5C5A3" />
      <polygon points="49,27 55,12 61,28" fill="#F5C5A3" />

      {/* Head */}
      <ellipse cx="40" cy="45" rx="28" ry="25" fill="#E27D3A" />

      {/* Chest/cheeks */}
      <ellipse cx="40" cy="55" rx="18" ry="15" fill="#FBE8D3" />

      {/* Eyes */}
      <g>
        {eyes.leftEye === "closed" || eyes.leftEye === "happy" ? (
          <path
            d={eyes.leftEye === "happy" ? "M28,40 Q32,36 36,40" : "M28,40 L36,40"}
            stroke="#2D1B0E"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        ) : (
          <ellipse
            cx="32"
            cy="40"
            rx={eyes.leftEye === "wide" ? 4 : eyes.leftEye === "squint" ? 3 : 3.5}
            ry={eyes.leftEye === "wide" ? 5 : eyes.leftEye === "squint" ? 2 : 4}
            fill="#2D1B0E"
          />
        )}
        {eyes.rightEye === "closed" || eyes.rightEye === "happy" ? (
          <path
            d={eyes.rightEye === "happy" ? "M44,40 Q48,36 52,40" : "M44,40 L52,40"}
            stroke="#2D1B0E"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        ) : (
          <ellipse
            cx="48"
            cy={eyes.rightEye === "down" ? 42 : 40}
            rx={eyes.rightEye === "wide" ? 4 : 3.5}
            ry={eyes.rightEye === "wide" ? 5 : eyes.rightEye === "soft" ? 3 : 4}
            fill="#2D1B0E"
          />
        )}
      </g>

      {/* Nose */}
      <ellipse cx="40" cy="48" rx="3" ry="2" fill="#2D1B0E" />

      {/* Mouth — varies by state */}
      {(state === "celebrating" || state === "waving") && (
        <path d="M36,52 Q40,57 44,52" stroke="#2D1B0E" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      )}
      {state === "encouraging" && (
        <path d="M37,53 Q40,55 43,53" stroke="#2D1B0E" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      )}

      {/* Tail — right side */}
      <path
        d={
          state === "celebrating"
            ? "M65,55 Q78,40 72,28"
            : state === "sleepy"
              ? "M55,62 Q65,65 68,60"
              : "M65,55 Q75,45 70,35"
        }
        stroke="#D4652A"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />

      {/* Waving paw */}
      {state === "waving" && (
        <ellipse cx="18" cy="30" rx="5" ry="4" fill="#E27D3A" />
      )}

      {/* Sparkles for celebrating */}
      {state === "celebrating" && (
        <>
          <circle cx="15" cy="25" r="2" fill="#FFD700" />
          <circle cx="65" cy="20" r="1.5" fill="#FFD700" />
          <circle cx="10" cy="45" r="1.5" fill="#FFD700" />
        </>
      )}
    </svg>
  );
}
