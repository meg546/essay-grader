import { useMemo, useEffect, useState, useRef, useCallback } from "react";
import type { GradingResult, CategoryScore } from "@/api/types";
import { useHighlightContext } from "@/lib/highlight-context";
import {
  buildSegments,
  getAllHighlights,
  buildCategoryColorMap,
  getCategoryColor,
  CATEGORY_HEX,
} from "@/lib/highlight-utils";
import type { HighlightSegment } from "@/lib/highlight-utils";
import { cn } from "@/lib/utils";

interface HighlightedEssayProps {
  result: GradingResult;
}

interface TooltipInfo {
  segmentId: string;
  categoryName: string;
  type: "strength" | "improvement";
  feedbackItems: string[];
  hexColor: string;
  top: number;
  left: number;
}

function getTooltipInfo(
  seg: HighlightSegment,
  categories: CategoryScore[],
  colorMap: Map<string, number>,
  rect: DOMRect,
  containerRect: DOMRect,
): TooltipInfo {
  const category = categories.find((c) => c.id === seg.categoryId);
  const colorIdx = colorMap.get(seg.categoryId) ?? 0;
  const items =
    seg.type === "strength"
      ? category?.strengths ?? []
      : category?.improvements ?? [];

  return {
    segmentId: seg.id,
    categoryName: category?.name ?? "Unknown",
    type: seg.type,
    feedbackItems: items,
    hexColor: CATEGORY_HEX[colorIdx % CATEGORY_HEX.length],
    top: rect.top - containerRect.top - 4,
    left: rect.left - containerRect.left + rect.width / 2,
  };
}

export function HighlightedEssay({ result }: HighlightedEssayProps) {
  const {
    activeCategoryId,
    activeHighlightId,
    setActiveHighlightId,
    disabledCategories,
    scrollTarget,
    setScrollTarget,
  } = useHighlightContext();

  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);

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

  const handleMouseEnter = useCallback(
    (seg: HighlightSegment, el: HTMLElement) => {
      setActiveHighlightId(seg.id);
      const container = containerRef.current;
      if (!container) return;
      const rect = el.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      setTooltip(
        getTooltipInfo(seg, result.categories, colorMap, rect, containerRect),
      );
    },
    [setActiveHighlightId, result.categories, colorMap],
  );

  const handleMouseLeave = useCallback(() => {
    setActiveHighlightId(null);
    setTooltip(null);
  }, [setActiveHighlightId]);

  return (
    <div ref={containerRef} className="relative whitespace-pre-wrap text-sm leading-relaxed">
      {segments.map((seg, i) => {
        if (seg.kind === "text") {
          return <span key={i}>{seg.text}</span>;
        }

        const colorIdx = colorMap.get(seg.categoryId) ?? 0;
        const color = getCategoryColor(colorIdx);
        const isIndividualActive = activeHighlightId === seg.id;
        const isCategoryActive = activeCategoryId === seg.categoryId;
        const isActive = isIndividualActive || isCategoryActive;
        const isDimmed =
          (activeHighlightId !== null && !isIndividualActive) ||
          (activeHighlightId === null &&
            activeCategoryId !== null &&
            !isCategoryActive);

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
            onMouseEnter={(e) => handleMouseEnter(seg, e.currentTarget)}
            onMouseLeave={handleMouseLeave}
          >
            {seg.text}
          </mark>
        );
      })}

      {tooltip && (
        <div
          className="pointer-events-none absolute z-50 max-w-xs -translate-x-1/2 -translate-y-full rounded-md border bg-popover px-3 py-2 text-popover-foreground shadow-md"
          style={{ top: tooltip.top, left: tooltip.left }}
        >
          <div
            className="mb-1 text-xs font-semibold"
            style={{ color: tooltip.hexColor }}
          >
            {tooltip.categoryName} —{" "}
            {tooltip.type === "strength" ? "Strength" : "Improvement"}
          </div>
          {tooltip.feedbackItems.length > 0 ? (
            <ul className="space-y-0.5">
              {tooltip.feedbackItems.slice(0, 3).map((item, i) => (
                <li key={i} className="text-xs leading-snug">
                  {item}
                </li>
              ))}
              {tooltip.feedbackItems.length > 3 && (
                <li className="text-xs text-muted-foreground">
                  +{tooltip.feedbackItems.length - 3} more...
                </li>
              )}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">
              No specific feedback for this passage.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
