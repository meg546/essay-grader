import { Card, CardContent } from "@/components/ui/card";
import { HighlightedEssay } from "@/components/results/HighlightedEssay";
import type { GradingResult } from "@/api/types";

interface EssayPanelProps {
  result: GradingResult;
}

export function EssayPanel({ result }: EssayPanelProps) {
  return (
    <Card className="lg:h-[calc(100vh-14rem)] lg:overflow-y-auto">
      <CardContent className="pt-6">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          Essay
        </h2>
        <HighlightedEssay result={result} />
      </CardContent>
    </Card>
  );
}
