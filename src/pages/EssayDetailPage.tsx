import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { Loader2 } from "lucide-react";

import { getHistoryItem } from "@/api/history";
import type { GradingResult } from "@/api/types";
import { Button } from "@/components/ui/button";
import { HighlightProvider } from "@/lib/highlight-context";
import { ColorLegend } from "@/components/results/ColorLegend";
import { EssayPanel } from "@/components/results/EssayPanel";
import { FeedbackPanel } from "@/components/results/FeedbackPanel";

export function EssayDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [result, setResult] = useState<GradingResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getHistoryItem(id)
      .then((data) => setResult(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" aria-live="polite">
        <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-muted-foreground">
          Could not load essay results.
        </p>
        <Button variant="outline" asChild>
          <Link to="/history">Back to Essays</Link>
        </Button>
      </div>
    );
  }

  return (
    <HighlightProvider key={result.id}>
      <div className="mx-auto max-w-[1400px] space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-balance">Essay Results</h1>
          <Button variant="outline" asChild>
            <Link to="/history">Back to Essays</Link>
          </Button>
        </div>
        <ColorLegend categories={result.categories} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <EssayPanel result={result} readOnly />
          <FeedbackPanel result={result} />
        </div>
      </div>
    </HighlightProvider>
  );
}
