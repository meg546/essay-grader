// Dark mode theme colors — derived from src/index.css OKLCH values
// These are used by Remotion compositions which render outside the app's CSS context
export const theme = {
  background: "#1a1917",       // oklch(0.15 0.01 60)
  foreground: "#edeceb",       // oklch(0.93 0.005 90)
  primary: "#4a9960",          // oklch(0.60 0.10 145)
  primaryForeground: "#1a1917",
  card: "#242320",             // oklch(0.18 0.01 60)
  cardForeground: "#edeceb",
  mutedForeground: "#908e8a",  // oklch(0.60 0.01 80)
  border: "#3d3b38",           // oklch(0.30 0.01 60)
  // Highlight colors from score-utils / highlight-utils
  emerald500: "#10b981",
  amber500: "#f59e0b",
  blue400: "#60a5fa",
  purple400: "#c084fc",
  orange400: "#fb923c",
  teal400: "#2dd4bf",
} as const;
