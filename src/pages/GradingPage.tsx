import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";
import { EssayInput } from "@/components/grading/EssayInput";
import { RubricEditor } from "@/components/grading/RubricEditor";

export function GradingPage() {
  const essayText = useAppStore((s) => s.essayText);
  const isSubmitDisabled = essayText.trim() === "";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Grade Essay</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <EssayInput />
        <RubricEditor />
      </div>

      <Button disabled={isSubmitDisabled} size="lg">
        Submit for Grading
      </Button>
    </div>
  );
}
