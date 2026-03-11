import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { theme } from "../theme";
import { ESSAY_TEXT, HIGHLIGHT_RANGES } from "../data";

export const HighlightsScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Each highlight appears sequentially over the first 3 seconds
  const framesPerHighlight = (3 * fps) / HIGHLIGHT_RANGES.length;

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
        AI-powered feedback
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
        }}
      >
        {renderHighlightedText(ESSAY_TEXT, HIGHLIGHT_RANGES, frame, framesPerHighlight)}
      </div>
    </div>
  );
};

function renderHighlightedText(
  text: string,
  highlights: typeof HIGHLIGHT_RANGES,
  frame: number,
  framesPerHighlight: number
) {
  // Build segments: split text around highlight ranges
  const result: (string | JSX.Element)[] = [];
  let lastIndex = 0;

  highlights.forEach((h, i) => {
    const startIdx = text.indexOf(h.text);
    if (startIdx === -1) return;

    // Progress for this highlight (0 to 1)
    const highlightStart = i * framesPerHighlight;
    const progress = interpolate(
      frame,
      [highlightStart, highlightStart + 15],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    // Text before this highlight
    if (startIdx > lastIndex) {
      result.push(text.slice(lastIndex, startIdx));
    }

    // The highlighted text
    const bgColor = theme[h.color];
    result.push(
      <span
        key={i}
        style={{
          backgroundColor: `${bgColor}33`, // 20% opacity
          color: bgColor,
          borderRadius: 4,
          padding: "2px 4px",
          opacity: progress,
          transition: "none",
        }}
      >
        {h.text}
      </span>
    );

    lastIndex = startIdx + h.text.length;
  });

  // Remaining text
  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }

  return result;
}
