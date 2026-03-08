import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CategoryScore } from "@/api/types";

interface CategoryFeedbackProps {
  category: CategoryScore;
}

export function CategoryFeedback({ category }: CategoryFeedbackProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger className="flex w-full cursor-pointer select-none items-center justify-between p-6">
          <span className="text-base font-semibold">{category.name}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm tabular-nums text-muted-foreground">
              {category.score}/{category.maxScore}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                open && "rotate-180"
              )}
            />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {category.strengths.length > 0 && (
              <div>
                <h4 className="mb-1 text-sm font-semibold text-emerald-700">
                  Strengths
                </h4>
                <ul className="space-y-1">
                  {category.strengths.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {category.improvements.length > 0 && (
              <div>
                <h4 className="mb-1 text-sm font-semibold text-amber-600">
                  Areas for Improvement
                </h4>
                <ul className="space-y-1">
                  {category.improvements.map((imp, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                      {imp}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {category.justification && (
              <div>
                <h4 className="mb-1 text-sm font-semibold text-muted-foreground">
                  Justification
                </h4>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {category.justification}
                </p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
