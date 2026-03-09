import { useMemo, useEffect } from "react";
import type { GradingResult } from "@/api/types";
import { useHighlightContext } from "@/lib/highlight-context";
import {
  buildSegments,
  getAllHighlights,
  buildCategoryColorMap,
  getCategoryColor,
} from "@/lib/highlight-utils";
import { cn } from "@/lib/utils";

interface HighlightedEssayProps {
  result: GradingResult;
}

export function HighlightedEssay({ result }: HighlightedEssayProps) {
  const {
    activeCategoryId,
    setActiveCategoryId,
    disabledCategories,
    scrollTarget,
    setScrollTarget,
  } = useHighlightContext();

  const colorMap = useMemo(
    () => buildCategoryColorMap(result.categories),
    [result.categories],
  );

  const allHighlights = useMemo(
    () => getAllHighlights(result.categories),
    [result.categories],
  );

  const segments = useMemo(
    () => buildSegments(result.essayText, allHighlights, disabledCategories),
    [result.essayText, allHighlights, disabledCategories],
  );

  useEffect(() => {
    if (!scrollTarget) return;
    const el = document.getElementById(`hl-${scrollTarget}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setScrollTarget(null);
  }, [scrollTarget, setScrollTarget]);

  return (
    <div className="whitespace-pre-wrap text-sm leading-relaxed">
      {segments.map((seg, i) => {
        if (seg.kind === "text") {
          return <span key={i}>{seg.text}</span>;
        }

        const colorIdx = colorMap.get(seg.categoryId) ?? 0;
        const color = getCategoryColor(colorIdx);
        const isActive = activeCategoryId === seg.categoryId;
        const isDimmed =
          activeCategoryId !== null && activeCategoryId !== seg.categoryId;

        return (
          <mark
            key={i}
            id={`hl-${seg.id}`}
            data-category-id={seg.categoryId}
            className={cn(
              "rounded-sm px-0.5 transition-all duration-200 cursor-pointer",
              isActive ? color.bgActive : color.bg,
              color.text,
              isDimmed && "opacity-30",
            )}
            onMouseEnter={() => setActiveCategoryId(seg.categoryId)}
            onMouseLeave={() => setActiveCategoryId(null)}
          >
            {seg.text}
          </mark>
        );
      })}
    </div>
  );
}
