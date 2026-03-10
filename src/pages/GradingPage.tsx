import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { HeroSection } from "@/components/grading/HeroSection";
import { toast } from "sonner";
import { useAppStore } from "@/stores/app-store";
import { useProfileStore } from "@/stores/profile-store";
import { gradeEssay } from "@/api/grading";
import { getErrorMessage } from "@/api/errors";
import { Button } from "@/components/ui/button";
import { SignInDialog } from "@/components/auth/SignInDialog";
import { EssayInput } from "@/components/grading/EssayInput";
import { RubricUpload } from "@/components/grading/RubricUpload";
import { HighlightProvider } from "@/lib/highlight-context";
import { ColorLegend } from "@/components/results/ColorLegend";
import { EssayPanel } from "@/components/results/EssayPanel";
import { FeedbackPanel } from "@/components/results/FeedbackPanel";

export function GradingPage() {
  const essayText = useAppStore((s) => s.essayText);
  const currentResult = useAppStore((s) => s.currentResult);
  const setCurrentResult = useAppStore((s) => s.setCurrentResult);
  const clearCurrentResult = useAppStore((s) => s.clearCurrentResult);

  const setEssayText = useAppStore((s) => s.setEssayText);
  const setRubricFile = useAppStore((s) => s.setRubricFile);
  const gradeLevel = useProfileStore((s) => s.gradeLevel);
  const isSignedIn = useProfileStore((s) => s.isSignedIn);
  const [isGrading, setIsGrading] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [isRegrading, setIsRegrading] = useState(false);
  const [heroCollapsed, setHeroCollapsed] = useState(essayText !== "");

  useEffect(() => {
    if (heroCollapsed) return;

    function onScroll() {
      if (window.scrollY > 50) {
        setHeroCollapsed(true);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [heroCollapsed]);

  const isSubmitDisabled = essayText.trim() === "" || isGrading;

  async function handleSubmit() {
    if (!isSignedIn) {
      setShowSignIn(true);
      return;
    }
    setIsGrading(true);
    try {
      const rubricFile = useAppStore.getState().rubricFile;
      const result = await gradeEssay(essayText, gradeLevel, rubricFile);
      setCurrentResult(result);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsGrading(false);
    }
  }

  async function handleRegrade() {
    setIsRegrading(true);
    try {
      const rubricFile = useAppStore.getState().rubricFile;
      const result = await gradeEssay(essayText, gradeLevel, rubricFile);
      setCurrentResult(result);
    } catch (error) {
      toast.error(getErrorMessage(error));
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

  function handleAuthenticated() {
    setShowSignIn(false);
    handleSubmit();
  }

  if (currentResult) {
    return (
      <>
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
        <SignInDialog open={showSignIn} onOpenChange={setShowSignIn} onAuthenticated={handleAuthenticated} />
      </>
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
            transition={{
              duration: 0.5,
              ease: [0.4, 0, 0.2, 1],
              opacity: { duration: 0.3, ease: "easeOut" },
            }}
            style={{ overflow: "hidden" }}
          >
            <HeroSection />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-6 md:grid-cols-2">
        <EssayInput disabled={isGrading} />
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

      <SignInDialog open={showSignIn} onOpenChange={setShowSignIn} onAuthenticated={handleAuthenticated} />
    </div>
  );
}
