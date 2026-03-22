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
  feedback: string;
  hexColor: string;
  top: number;
  left: number;
  placeBelow: boolean;
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

  const rawTop = rect.top - containerRect.top - 4;
  // If tooltip would overflow above the container, place it below the highlight instead
  const top = rawTop < 60 ? rect.bottom - containerRect.top + 8 : rawTop;
  const placeBelow = rawTop < 60;
  const left = Math.max(
    120,
    Math.min(
      rect.left - containerRect.left + rect.width / 2,
      containerRect.width - 120,
    ),
  );

  return {
    segmentId: seg.id,
    categoryName: category?.name ?? "Unknown",
    type: seg.type,
    feedback: seg.feedback,
    hexColor: CATEGORY_HEX[colorIdx % CATEGORY_HEX.length],
    top,
    left,
    placeBelow,
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
          const textDimmed = activeHighlightId !== null || activeCategoryId !== null;
          return (
            <span key={i} className={cn("transition-opacity duration-200", textDimmed && "opacity-30")}>
              {seg.text}
            </span>
          );
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
            role="button"
            tabIndex={0}
            aria-describedby={tooltip?.segmentId === seg.id ? `tooltip-${seg.id}` : undefined}
            className={cn(
              "rounded-sm px-0.5 transition-[background-color,opacity] duration-200 cursor-pointer",
              isActive ? color.bgActive : color.bg,
              color.text,
              isDimmed && "opacity-30",
            )}
            onMouseEnter={(e) => handleMouseEnter(seg, e.currentTarget)}
            onMouseLeave={handleMouseLeave}
            onFocus={(e) => handleMouseEnter(seg, e.currentTarget)}
            onBlur={handleMouseLeave}
          >
            {seg.text}
          </mark>
        );
      })}

      {tooltip && (
        <div
          role="tooltip"
          id={`tooltip-${tooltip.segmentId}`}
          className={cn(
            "pointer-events-none absolute z-50 max-w-xs -translate-x-1/2 rounded-md border bg-popover px-3 py-2 text-popover-foreground shadow-md",
            !tooltip.placeBelow && "-translate-y-full",
          )}
          style={{ top: tooltip.top, left: tooltip.left }}
        >
          <div
            className="mb-1 text-xs font-semibold"
            style={{ color: tooltip.hexColor }}
          >
            {tooltip.categoryName} —{" "}
            {tooltip.type === "strength" ? "Strength" : "Improvement"}
          </div>
          <p className="text-xs leading-snug">
            {tooltip.feedback}
          </p>
        </div>
      )}
    </div>
  );
}
