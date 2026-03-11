import { Eye, EyeOff } from "lucide-react";
import type { CategoryScore } from "@/api/types";
import { useHighlightContext } from "@/lib/highlight-context";
import { buildCategoryColorMap, getCategoryColor } from "@/lib/highlight-utils";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface ColorLegendProps {
  categories: CategoryScore[];
}

export function ColorLegend({ categories }: ColorLegendProps) {
  const { disabledCategories, toggleCategory } = useHighlightContext();

  const colorMap = useMemo(
    () => buildCategoryColorMap(categories),
    [categories],
  );

  return (
    <div className="mb-4 flex flex-wrap gap-3">
      {categories.map((cat) => {
        const colorIdx = colorMap.get(cat.id) ?? 0;
        const color = getCategoryColor(colorIdx);
        const isDisabled = disabledCategories.has(cat.id);
        const Icon = isDisabled ? EyeOff : Eye;

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => toggleCategory(cat.id)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-opacity inline-flex items-center gap-1.5",
              color.bg,
              color.text,
              isDisabled && "opacity-40 line-through",
            )}
          >
            <Icon aria-hidden="true" className="h-3 w-3" />
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
