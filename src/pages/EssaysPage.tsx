import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { getHistory, deleteHistoryItem } from "@/api/history";
import type { HistoryItem } from "@/api/types";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function EssaysPage() {
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

  async function handleDelete(e: React.MouseEvent, item: HistoryItem) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this essay?")) return;
    // Optimistically remove the item
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    try {
      await deleteHistoryItem(item.id);
      toast.success("Essay deleted");
    } catch {
      // Restore the item on failure
      setItems((prev) => {
        const restored = [...prev, item].sort(
          (a, b) =>
            new Date(b.gradedAt).getTime() - new Date(a.gradedAt).getTime()
        );
        return restored;
      });
      toast.error("Failed to delete essay");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" aria-live="polite">
        <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-muted-foreground">
          No essays graded yet. Submit your first essay to get started.
        </p>
        <Link
          to="/grade"
          className={cn(buttonVariants({ variant: "default" }))}
        >
          Go to Grading
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-balance">My Essays</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="group relative">
            <Link to={`/history/${item.id}`} className="block cursor-pointer">
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="p-4 h-24">
                  <div className="flex items-center justify-between pr-6">
                    <span className="text-lg font-semibold tabular-nums">
                      {item.overallScore}/{item.maxScore}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.gradedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {item.essayExcerpt}
                  </p>
                </CardContent>
              </Card>
            </Link>

            <button
              aria-label="Delete essay"
              onClick={(e) => handleDelete(e, item)}
              className="absolute top-2 right-2 h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100 z-10"
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
