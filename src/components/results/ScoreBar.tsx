import { cn } from "@/lib/utils";
import { getScoreBarColor, getScoreLevel } from "@/lib/score-utils";

interface ScoreBarProps {
  name: string;
  score: number;
  maxScore: number;
}

export function ScoreBar({ name, score, maxScore }: ScoreBarProps) {
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const level = getScoreLevel(score, maxScore);
  const barColor = getScoreBarColor(level);

  return (
    <div className="flex items-center gap-3">
      <span className="w-40 shrink-0 truncate text-sm font-medium">{name}</span>
      <div className="relative h-6 flex-1 overflow-hidden rounded-lg bg-muted">
        <div
          className={cn("h-full rounded-lg transition-all duration-700 ease-out", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-12 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
        {score}/{maxScore}
      </span>
    </div>
  );
}
