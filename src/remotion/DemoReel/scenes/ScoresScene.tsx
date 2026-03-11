import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { theme } from "../theme";
import { SCORES, OVERALL_SCORE } from "../data";

export const ScoresScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Overall score counter
  const overallDisplay = Math.round(
    interpolate(frame, [0, fps * 1.5], [0, OVERALL_SCORE], {
      extrapolateRight: "clamp",
    })
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 60,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: theme.mutedForeground,
          textTransform: "uppercase",
          letterSpacing: 1.5,
          marginBottom: 16,
        }}
      >
        Results
      </div>

      {/* Overall score */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 32,
          opacity: interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <div style={{ fontSize: 56, fontWeight: 700, color: theme.foreground }}>
          {overallDisplay}
        </div>
        <div style={{ fontSize: 16, color: theme.mutedForeground }}>Overall Score</div>
      </div>

      {/* Category bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {SCORES.map((item, i) => {
          const barDelay = 10 + i * 8;
          const barWidth = interpolate(
            frame,
            [barDelay, barDelay + 20],
            [0, item.score],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          const rowOpacity = interpolate(
            frame,
            [barDelay - 5, barDelay],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <div
              key={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                opacity: rowOpacity,
              }}
            >
              <div style={{ width: 180, fontSize: 15, color: theme.mutedForeground }}>
                {item.label}
              </div>
              <div
                style={{
                  flex: 1,
                  height: 10,
                  background: theme.border,
                  borderRadius: 5,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${barWidth}%`,
                    height: "100%",
                    background: theme[item.color],
                    borderRadius: 5,
                  }}
                />
              </div>
              <div
                style={{
                  width: 40,
                  textAlign: "right",
                  fontSize: 15,
                  fontWeight: 600,
                  color: theme.foreground,
                }}
              >
                {Math.round(barWidth)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
