import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ResultsSummary } from "@/components/results/ResultsSummary";
import { ScoreOverview } from "@/components/results/ScoreOverview";
import { CategoryFeedback } from "@/components/results/CategoryFeedback";
import type { GradingResult } from "@/api/types";

interface FeedbackPanelProps {
  result: GradingResult;
  isLoading?: boolean;
}

export function FeedbackPanel({ result, isLoading }: FeedbackPanelProps) {
  return (
    <Card className="lg:h-[calc(100vh-14rem)] lg:overflow-y-auto">
      <CardContent className="relative space-y-6 pt-6">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Re-grading...</p>
            </div>
          </div>
        )}
        <ResultsSummary result={result} />
        <ScoreOverview categories={result.categories} />
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-balance">Detailed Feedback</h2>
          {result.categories.map((cat, i) => (
            <CategoryFeedback key={cat.id} category={cat} colorIndex={i} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
