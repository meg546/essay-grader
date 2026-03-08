import { Trash2 } from "lucide-react";
import type { RubricCategory } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RubricCategoryRowProps {
  category: RubricCategory;
  index: number;
  onUpdate: (index: number, updates: Partial<RubricCategory>) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

export function RubricCategoryRow({
  category,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: RubricCategoryRowProps) {
  return (
    <div className="flex items-center gap-3">
      <Input
        value={category.name}
        onChange={(e) => onUpdate(index, { name: e.target.value })}
        className="flex-1"
        placeholder="Category name"
      />
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        Max:
      </span>
      <Input
        type="number"
        value={category.maxScore}
        onChange={(e) =>
          onUpdate(index, { maxScore: Number(e.target.value) })
        }
        min={1}
        max={100}
        className="w-20"
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(index)}
        disabled={!canRemove}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
