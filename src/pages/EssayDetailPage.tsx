import { useState, useEffect, startTransition } from "react";
import { useParams, Link } from "react-router";
import { Loader2 } from "lucide-react";

import { getHistoryItem } from "@/api/history";
import type { GradingResult } from "@/api/types";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HighlightProvider } from "@/lib/HighlightContext";
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
    let cancelled = false;
    startTransition(() => {
      if (!cancelled) {
        setLoading(true);
        setError(false);
        setResult(null);
      }
    });
    void getHistoryItem(id)
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
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
        <Link
          to="/history"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Back to Essays
        </Link>
      </div>
    );
  }

  return (
    <HighlightProvider key={result.id}>
      <div className="mx-auto max-w-[1400px] space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-balance">Essay Results</h1>
          <Link
            to="/history"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Back to Essays
          </Link>
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
