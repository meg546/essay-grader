import { useState, useRef } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/stores/app-store";
import { useProfileStore } from "@/stores/profile-store";
import { gradeEssay } from "@/api/grading";
import { getErrorMessage } from "@/api/errors";
import { Button } from "@/components/ui/button";
import { SignInDialog } from "@/components/auth/SignInDialog";
import { EssayInput, type EssayInputHandle } from "@/components/grading/EssayInput";
import { GradingToolbar } from "@/components/grading/GradingToolbar";
import { WordStats } from "@/components/grading/WordStats";
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

  // Toolbar state
  const [tone, setTone] = useState("academic");
  const [gradeLevelOverride, setGradeLevelOverride] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);

  const essayInputRef = useRef<EssayInputHandle>(null);

  const isSubmitDisabled = essayText.trim() === "" || isGrading;

  async function handleSubmit() {
    if (!isSignedIn) {
      setShowSignIn(true);
      return;
    }
    setIsGrading(true);
    try {
      const rubricFile = useAppStore.getState().rubricFile;
      const effectiveGradeLevel = gradeLevelOverride || gradeLevel || "college";
      const result = await gradeEssay(essayText, effectiveGradeLevel, rubricFile, undefined, tone);
      setCurrentResult(result);
      // Reset per-submission state
      setTone("academic");
      setGradeLevelOverride(null);
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
      const effectiveGradeLevel = gradeLevelOverride || gradeLevel || "college";
      const result = await gradeEssay(essayText, effectiveGradeLevel, rubricFile, undefined, tone);
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
  }

  function handleClear() {
    setEssayText("");
    setRubricFile(null);
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
    <div className="mx-auto max-w-[1400px] flex flex-col h-[calc(100vh-7rem)]">
      <div className="flex flex-1 min-h-0 border rounded-lg overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0">
          <EssayInput ref={essayInputRef} disabled={isGrading} />
          <WordStats essayText={essayText} visible={showStats} />
        </div>
        <GradingToolbar
          disabled={isGrading}
          essayText={essayText}
          onClear={handleClear}
          tone={tone}
          onToneChange={setTone}
          gradeLevelOverride={gradeLevelOverride}
          onGradeLevelChange={setGradeLevelOverride}
          userGradeLevel={gradeLevel}
          onUploadEssayFile={() => essayInputRef.current?.triggerFileUpload()}
          onStatsToggle={setShowStats}
        />
      </div>

      <div className="pt-4 shrink-0">
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

      <SignInDialog open={showSignIn} onOpenChange={setShowSignIn} onAuthenticated={handleAuthenticated} />
    </div>
  );
}
