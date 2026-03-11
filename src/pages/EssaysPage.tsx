import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { Loader2 } from "lucide-react";

import { getHistory } from "@/api/history";
import type { HistoryItem } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function EssaysPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory()
      .then((data) => {
        const sorted = data.sort(
          (a, b) =>
            new Date(b.gradedAt).getTime() - new Date(a.gradedAt).getTime()
        );
        setItems(sorted);
      })
      .catch(() => {
        // Silently handle -- user sees empty state
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-muted-foreground">
          No essays graded yet. Submit your first essay to get started.
        </p>
        <Button onClick={() => navigate("/grade")}>Go to Grading</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-balance">My Essays</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link key={item.id} to={`/history/${item.id}`} className="block cursor-pointer">
            <Card className="transition-colors hover:bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold tabular-nums">
                    {item.overallScore}/{item.maxScore}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.gradedAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {item.essayExcerpt}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
