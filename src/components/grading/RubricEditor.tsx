import { Plus, RotateCcw } from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RubricCategoryRow } from "./RubricCategoryRow";

export function RubricEditor() {
  const rubricCategories = useAppStore((s) => s.rubricCategories);
  const updateCategory = useAppStore((s) => s.updateCategory);
  const addCategory = useAppStore((s) => s.addCategory);
  const removeCategory = useAppStore((s) => s.removeCategory);
  const resetRubric = useAppStore((s) => s.resetRubric);

  const canRemove = rubricCategories.length > 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grading Rubric</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rubricCategories.map((category, index) => (
          <RubricCategoryRow
            key={index}
            category={category}
            index={index}
            onUpdate={updateCategory}
            onRemove={removeCategory}
            canRemove={canRemove}
          />
        ))}

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={addCategory}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
          <Button variant="ghost" size="sm" onClick={resetRubric}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
