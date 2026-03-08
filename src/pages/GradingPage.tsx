import { useState } from "react";
import { useNavigate } from "react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/stores/app-store";
import { gradeEssay } from "@/api/grading";
import { Button } from "@/components/ui/button";
import { EssayInput } from "@/components/grading/EssayInput";
import { RubricEditor } from "@/components/grading/RubricEditor";

export function GradingPage() {
  const essayText = useAppStore((s) => s.essayText);
  const rubricCategories = useAppStore((s) => s.rubricCategories);
  const setCurrentResult = useAppStore((s) => s.setCurrentResult);
  const addToHistory = useAppStore((s) => s.addToHistory);
  const [isGrading, setIsGrading] = useState(false);
  const navigate = useNavigate();

  const isSubmitDisabled = essayText.trim() === "" || isGrading;

  async function handleSubmit() {
    setIsGrading(true);
    try {
      const result = await gradeEssay({ essayText, rubric: rubricCategories });
      setCurrentResult(result);
      addToHistory(result);
      navigate(`/results/${result.id}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsGrading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Grade Essay</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <EssayInput disabled={isGrading} />
        <RubricEditor disabled={isGrading} />
      </div>

      <Button disabled={isSubmitDisabled} size="lg" onClick={handleSubmit}>
        {isGrading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Reviewing your work...
          </>
        ) : (
          "Submit for Grading"
        )}
      </Button>
    </div>
  );
}
