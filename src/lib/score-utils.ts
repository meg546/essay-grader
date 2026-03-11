export type ScoreLevel = "high" | "medium" | "low";

export function getScoreLevel(score: number, maxScore: number): ScoreLevel {
  if (maxScore === 0) return "low";
  const pct = (score / maxScore) * 100;
  if (pct >= 70) return "high";
  if (pct >= 40) return "medium";
  return "low";
}

export function getScoreBarColor(level: ScoreLevel): string {
  switch (level) {
    case "high":
      return "bg-emerald-500";
    case "medium":
      return "bg-amber-400";
    case "low":
      return "bg-rose-500";
  }
}

export function getScoreTextColor(level: ScoreLevel): string {
  switch (level) {
    case "high":
      return "text-emerald-700 dark:text-emerald-400";
    case "medium":
      return "text-amber-600 dark:text-amber-400";
    case "low":
      return "text-rose-600 dark:text-rose-400";
  }
}
