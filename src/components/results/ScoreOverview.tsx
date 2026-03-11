import { ScoreBar } from "@/components/results/ScoreBar";
import type { CategoryScore } from "@/api/types";

interface ScoreOverviewProps {
  categories: CategoryScore[];
}

export function ScoreOverview({ categories }: ScoreOverviewProps) {
  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold text-balance">Score Breakdown</h2>
      <div className="space-y-3">
        {categories.map((cat) => (
          <ScoreBar
            key={cat.name}
            name={cat.name}
            score={cat.score}
            maxScore={cat.maxScore}
          />
        ))}
      </div>
    </div>
  );
}
