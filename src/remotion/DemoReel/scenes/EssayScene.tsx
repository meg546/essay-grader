import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { theme } from "../theme";
import { ESSAY_TEXT } from "../data";

export const EssayScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const duration = 3 * fps; // 90 frames at 30fps

  // Characters revealed over 2.5s, leaving 0.5s buffer
  const charsToShow = Math.floor(
    interpolate(frame, [0, duration * 0.85], [0, ESSAY_TEXT.length], {
      extrapolateRight: "clamp",
    })
  );

  const visibleText = ESSAY_TEXT.slice(0, charsToShow);

  // Blinking cursor
  const cursorOpacity = Math.sin(frame * 0.3) > 0 ? 1 : 0;

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
        Paste your essay
      </div>
      <div
        style={{
          background: theme.background,
          border: `1px solid ${theme.border}`,
          borderRadius: 12,
          padding: 24,
          fontFamily: "monospace",
          fontSize: 18,
          lineHeight: 1.7,
          color: theme.foreground,
          minHeight: 200,
        }}
      >
        {visibleText}
        <span
          style={{
            display: "inline-block",
            width: 2,
            height: 20,
            background: theme.primary,
            marginLeft: 2,
            opacity: cursorOpacity,
            verticalAlign: "text-bottom",
          }}
        />
      </div>
    </div>
  );
};
