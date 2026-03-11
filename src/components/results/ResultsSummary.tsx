import { Card, CardContent } from "@/components/ui/card";
import { getScoreLevel, getScoreTextColor } from "@/lib/score-utils";
import type { GradingResult } from "@/api/types";

interface ResultsSummaryProps {
  result: GradingResult;
}

export function ResultsSummary({ result }: ResultsSummaryProps) {
  const pct =
    result.maxScore > 0
      ? Math.round((result.overallScore / result.maxScore) * 100)
      : 0;
  const level = getScoreLevel(result.overallScore, result.maxScore);
  const scoreColor = getScoreTextColor(level);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 flex items-baseline gap-1">
          <span className={`text-4xl font-bold tabular-nums ${scoreColor}`}>
            {result.overallScore}
          </span>
          <span className="text-xl text-muted-foreground tabular-nums">/ {result.maxScore}</span>
          <span className={`ml-2 text-lg font-medium tabular-nums ${scoreColor}`}>
            ({pct}%)
          </span>
        </div>
        <p className="leading-relaxed text-muted-foreground">{result.summary}</p>
      </CardContent>
    </Card>
  );
}
