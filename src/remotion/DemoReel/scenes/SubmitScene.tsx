import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { theme } from "../theme";
import { ESSAY_TEXT } from "../data";

export const SubmitScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Button press animation at frame 15 (0.5s in)
  const buttonScale = interpolate(frame, [12, 15, 18], [1, 0.95, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Loading bar appears after button press
  const loadingProgress = interpolate(frame, [20, fps * 2], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade in the loading bar
  const loadingOpacity = interpolate(frame, [18, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 60,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Essay text (fully shown, dimmed) */}
      <div
        style={{
          background: theme.background,
          border: `1px solid ${theme.border}`,
          borderRadius: 12,
          padding: 24,
          fontFamily: "monospace",
          fontSize: 18,
          lineHeight: 1.7,
          color: theme.mutedForeground,
          marginBottom: 24,
          minHeight: 160,
        }}
      >
        {ESSAY_TEXT}
      </div>

      {/* Submit button */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <div
          style={{
            background: theme.primary,
            color: theme.primaryForeground,
            padding: "12px 32px",
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            transform: `scale(${buttonScale})`,
          }}
        >
          Submit for Grading
        </div>

        {/* Loading bar */}
        <div
          style={{
            width: 240,
            height: 8,
            background: theme.border,
            borderRadius: 4,
            overflow: "hidden",
            opacity: loadingOpacity,
          }}
        >
          <div
            style={{
              width: `${loadingProgress}%`,
              height: "100%",
              background: theme.primary,
              borderRadius: 4,
            }}
          />
        </div>
      </div>
    </div>
  );
};
