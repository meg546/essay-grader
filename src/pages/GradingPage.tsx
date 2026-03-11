import { useState, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { useProfileStore } from "@/stores/profile-store";
import { gradeEssay } from "@/api/grading";
import { useFoxStore } from "@/stores/fox-store";
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

  // Mobile results tab state
  const [resultTab, setResultTab] = useState<"essay" | "feedback">("essay");

  const essayInputRef = useRef<EssayInputHandle>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const setFoxState = useFoxStore((s) => s.setFoxState);

  // Fox reacts to typing
  useEffect(() => {
    if (essayText.trim() === "") return;
    setFoxState("attentive");
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setFoxState("idle");
    }, 30_000);
  }, [essayText, setFoxState]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const isSubmitDisabled = essayText.trim() === "" || isGrading;

  async function handleSubmit() {
    if (!isSignedIn) {
      setShowSignIn(true);
      return;
    }
    setIsGrading(true);
    setFoxState("thinking");
    try {
      const rubricFile = useAppStore.getState().rubricFile;
      const effectiveGradeLevel = gradeLevelOverride || gradeLevel || "college";
      const result = await gradeEssay(essayText, effectiveGradeLevel, rubricFile, undefined, tone);
      setCurrentResult(result);
      // Fox reacts to results
      const percentage = (result.overallScore / result.maxScore) * 100;
      if (percentage > 80) {
        setFoxState("celebrating");
      } else if (percentage < 60) {
        setFoxState("encouraging");
      } else {
        setFoxState("attentive");
      }
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
              <h1 className="text-2xl font-bold text-balance">Grading Results</h1>
              <Button variant="outline" onClick={handleReset}>
                Grade Another
              </Button>
            </div>
            <ColorLegend categories={currentResult.categories} />

            {/* Mobile tab bar */}
            <div className="flex md:hidden border-b">
              <button
                onClick={() => setResultTab("essay")}
                className={cn(
                  "flex-1 py-2.5 text-sm text-center transition-colors min-h-[44px]",
                  resultTab === "essay"
                    ? "border-b-2 border-primary text-primary font-medium"
                    : "text-muted-foreground"
                )}
              >
                Essay
              </button>
              <button
                onClick={() => setResultTab("feedback")}
                className={cn(
                  "flex-1 py-2.5 text-sm text-center transition-colors min-h-[44px]",
                  resultTab === "feedback"
                    ? "border-b-2 border-primary text-primary font-medium"
                    : "text-muted-foreground"
                )}
              >
                Feedback
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className={cn("md:block", resultTab !== "essay" && "hidden")}>
                <EssayPanel result={currentResult} onRegrade={handleRegrade} isRegrading={isRegrading} />
              </div>
              <div className={cn("md:block", resultTab !== "feedback" && "hidden")}>
                <FeedbackPanel result={currentResult} isLoading={isRegrading} />
              </div>
            </div>
          </div>
        </HighlightProvider>
        <SignInDialog open={showSignIn} onOpenChange={setShowSignIn} onAuthenticated={handleAuthenticated} />
      </>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] flex flex-col min-h-[calc(100vh-7rem)] md:h-[calc(100vh-7rem)]">
      <div className="flex flex-col md:flex-row flex-1 min-h-0 border rounded-lg overflow-hidden">
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

      <div className="pt-4 shrink-0 sticky bottom-0 bg-background pb-4 md:pb-0 md:relative md:bg-transparent">
        <Button disabled={isSubmitDisabled} size="lg" onClick={handleSubmit} className="w-full md:w-auto">
          {isGrading ? (
            <>
              <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />
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
