import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { theme } from "../theme";
import { SCORES, OVERALL_SCORE, HIGHLIGHT_RANGES } from "../data";

export const HoldScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const duration = 3 * fps; // 90 frames

  // Fade out in the last second
  const opacity = interpolate(
    frame,
    [duration - fps, duration],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div style={{ opacity }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: 60,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Mini results summary */}
        <div style={{ display: "flex", gap: 40, alignItems: "flex-start" }}>
          {/* Score column */}
          <div style={{ flex: 1 }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 48, fontWeight: 700, color: theme.foreground }}>
                {OVERALL_SCORE}
              </div>
              <div style={{ fontSize: 14, color: theme.mutedForeground }}>Overall Score</div>
            </div>
            {SCORES.map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 10,
                }}
              >
                <div style={{ width: 140, fontSize: 13, color: theme.mutedForeground }}>
                  {item.label}
                </div>
                <div
                  style={{
                    flex: 1,
                    height: 8,
                    background: theme.border,
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${item.score}%`,
                      height: "100%",
                      background: theme[item.color],
                      borderRadius: 4,
                    }}
                  />
                </div>
                <div style={{ width: 32, fontSize: 13, fontWeight: 600, color: theme.foreground, textAlign: "right" }}>
                  {item.score}
                </div>
              </div>
            ))}
          </div>

          {/* Feedback snippet */}
          <div
            style={{
              flex: 1,
              background: theme.card,
              borderRadius: 12,
              padding: 20,
              border: `1px solid ${theme.border}`,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: theme.mutedForeground,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 12,
              }}
            >
              Feedback
            </div>
            {HIGHLIGHT_RANGES.map((h, i) => (
              <div key={i} style={{ marginBottom: 10, fontSize: 14, color: theme.foreground }}>
                <span
                  style={{
                    backgroundColor: `${theme[h.color]}33`,
                    color: theme[h.color],
                    borderRadius: 3,
                    padding: "1px 4px",
                  }}
                >
                  "{h.text}"
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
