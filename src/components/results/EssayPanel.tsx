import { useState, useEffect } from "react";
import { Pencil, Check, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HighlightedEssay } from "@/components/results/HighlightedEssay";
import { useAppStore } from "@/stores/app-store";
import { cn } from "@/lib/utils";
import type { GradingResult } from "@/api/types";

const TEXT_SIZE_CLASS = {
  small: "text-sm",
  normal: "text-base",
  large: "text-lg",
} as const;

interface EssayPanelProps {
  result: GradingResult;
  onRegrade?: () => void;
  isRegrading?: boolean;
  readOnly?: boolean;
}

export function EssayPanel({ result, onRegrade, isRegrading, readOnly }: EssayPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const essayText = useAppStore((s) => s.essayText);
  const setEssayText = useAppStore((s) => s.setEssayText);
  const textSize = useAppStore((s) => s.textSize);

  useEffect(() => {
    if (!readOnly) {
      setEssayText(result.essayText);
    }
  }, [result.essayText, setEssayText, readOnly]);

  const hasChanges = !readOnly && essayText !== result.essayText;

  return (
    <Card className="lg:h-[calc(100vh-14rem)] lg:overflow-y-auto">
      <CardContent className="pt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Essay
          </h2>
          {!readOnly && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                aria-label={isEditing ? "Save edit" : "Edit essay"}
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? (
                  <Check aria-hidden="true" className="h-4 w-4" />
                ) : (
                  <Pencil aria-hidden="true" className="h-4 w-4" />
                )}
              </Button>
              {isRegrading ? (
                <Button variant="default" size="sm" disabled>
                  <Loader2 aria-hidden="true" className="mr-1 h-3 w-3 animate-spin" />
                  Re-grading...
                </Button>
              ) : (
                hasChanges && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={onRegrade}
                    disabled={isRegrading}
                  >
                    Re-grade
                  </Button>
                )
              )}
            </div>
          )}
        </div>
        {isEditing ? (
          <textarea
            className={cn("w-full min-h-[400px] resize-none rounded-md border border-input bg-background p-3 leading-relaxed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", TEXT_SIZE_CLASS[textSize])}
            value={essayText}
            onChange={(e) => setEssayText(e.target.value)}
          />
        ) : (
          <div className={TEXT_SIZE_CLASS[textSize]}>
            <HighlightedEssay result={result} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
