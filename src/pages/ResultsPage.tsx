import { Link } from "react-router";
import { useAppStore } from "@/stores/app-store";
import { buttonVariants } from "@/components/ui/button";
import { ResultsSummary } from "@/components/results/ResultsSummary";
import { ScoreOverview } from "@/components/results/ScoreOverview";
import { CategoryFeedback } from "@/components/results/CategoryFeedback";

export function ResultsPage() {
  const currentResult = useAppStore((s) => s.currentResult);

  if (!currentResult) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-lg text-muted-foreground">
          No grading result found.
        </p>
        <Link to="/grade" className={buttonVariants()}>
          Grade an Essay
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Grading Results</h1>
      <ResultsSummary result={currentResult} />
      <ScoreOverview categories={currentResult.categories} />

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Detailed Feedback</h2>
        {currentResult.categories.map((cat) => (
          <CategoryFeedback key={cat.name} category={cat} />
        ))}
      </div>
    </div>
  );
}
