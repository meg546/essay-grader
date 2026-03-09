import { Card, CardContent } from "@/components/ui/card";
import { ResultsSummary } from "@/components/results/ResultsSummary";
import { ScoreOverview } from "@/components/results/ScoreOverview";
import { CategoryFeedback } from "@/components/results/CategoryFeedback";
import type { GradingResult } from "@/api/types";

interface FeedbackPanelProps {
  result: GradingResult;
}

export function FeedbackPanel({ result }: FeedbackPanelProps) {
  return (
    <Card className="lg:h-[calc(100vh-14rem)] lg:overflow-y-auto">
      <CardContent className="space-y-6 pt-6">
        <ResultsSummary result={result} />
        <ScoreOverview categories={result.categories} />
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Detailed Feedback</h2>
          {result.categories.map((cat, i) => (
            <CategoryFeedback key={cat.id} category={cat} colorIndex={i} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
