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
import { HighlightProvider } from "@/lib/highlight-context";
import { ColorLegend } from "@/components/results/ColorLegend";
import { EssayPanel } from "@/components/results/EssayPanel";
import { FeedbackPanel } from "@/components/results/FeedbackPanel";

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
  const [isRegrading, setIsRegrading] = useState(false);
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

  async function handleRegrade() {
    setIsRegrading(true);
    try {
      const result = await gradeEssay({
        essayText,
        rubricFile: rubricFile ?? undefined,
        gradeLevel,
      });
      setCurrentResult(result);
      addToHistory(result);
    } catch {
      toast.error("Re-grading failed. Please try again.");
    } finally {
      setIsRegrading(false);
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
      <HighlightProvider key={currentResult.id}>
        <div className="mx-auto max-w-[1400px] space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Grading Results</h1>
            <Button variant="outline" onClick={handleReset}>
              Grade Another
            </Button>
          </div>
          <ColorLegend categories={currentResult.categories} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <EssayPanel result={currentResult} onRegrade={handleRegrade} isRegrading={isRegrading} />
            <FeedbackPanel result={currentResult} isLoading={isRegrading} />
          </div>
        </div>
      </HighlightProvider>
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
