import { useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { HeroSection } from "@/components/grading/HeroSection";
import { toast } from "sonner";
import { useAppStore } from "@/stores/app-store";
import { useProfileStore } from "@/stores/profile-store";
import { gradeEssay } from "@/api/grading";
import { Button } from "@/components/ui/button";
import { EssayInput } from "@/components/grading/EssayInput";
import { RubricUpload } from "@/components/grading/RubricUpload";
import { ResultsSummary } from "@/components/results/ResultsSummary";
import { ScoreOverview } from "@/components/results/ScoreOverview";
import { CategoryFeedback } from "@/components/results/CategoryFeedback";

export function GradingPage() {
  const essayText = useAppStore((s) => s.essayText);
  const rubricFile = useAppStore((s) => s.rubricFile);
  const currentResult = useAppStore((s) => s.currentResult);
  const setCurrentResult = useAppStore((s) => s.setCurrentResult);
  const clearCurrentResult = useAppStore((s) => s.clearCurrentResult);
  const addToHistory = useAppStore((s) => s.addToHistory);
  const setEssayText = useAppStore((s) => s.setEssayText);
  const setRubricFile = useAppStore((s) => s.setRubricFile);
  const gradeLevel = useProfileStore((s) => s.gradeLevel);
  const [isGrading, setIsGrading] = useState(false);
  const [heroCollapsed, setHeroCollapsed] = useState(essayText !== "");

  const handleEssayFocus = useCallback(() => {
    setHeroCollapsed(true);
  }, []);

  const isSubmitDisabled = essayText.trim() === "" || isGrading;

  async function handleSubmit() {
    setIsGrading(true);
    try {
      const result = await gradeEssay({
        essayText,
        rubricFile: rubricFile ?? undefined,
        gradeLevel,
      });
      setCurrentResult(result);
      addToHistory(result);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsGrading(false);
    }
  }

  function handleReset() {
    clearCurrentResult();
    setEssayText("");
    setRubricFile(null);
    setHeroCollapsed(false);
  }

  if (currentResult) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Grading Results</h1>
          <Button variant="outline" onClick={handleReset}>
            Grade Another
          </Button>
        </div>
        <ResultsSummary result={currentResult} />
        <ScoreOverview categories={currentResult.categories} />
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Detailed Feedback</h2>
          {currentResult.categories.map((cat) => (
            <CategoryFeedback key={cat.name} category={cat} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <AnimatePresence initial={false}>
        {!heroCollapsed && (
          <motion.div
            key="hero"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <HeroSection />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-6 md:grid-cols-2">
        <EssayInput onFocus={handleEssayFocus} disabled={isGrading} />
        <RubricUpload disabled={isGrading} />
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
