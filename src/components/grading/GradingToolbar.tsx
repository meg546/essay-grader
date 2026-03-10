import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  FileUp,
  BarChart3,
  Clock,
  Eraser,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { RubricModal } from "./RubricModal";
import { ToneSelector } from "./ToneSelector";
import { GradingSettings } from "./GradingSettings";

interface GradingToolbarProps {
  disabled?: boolean;
  essayText: string;
  onClear: () => void;
  tone: string;
  onToneChange: (tone: string) => void;
  gradeLevelOverride: string | null;
  onGradeLevelChange: (level: string | null) => void;
  userGradeLevel: string | null;
  onUploadEssayFile: () => void;
  onStatsToggle: (visible: boolean) => void;
}

function ToolbarButton({
  onClick,
  label,
  active,
  destructive,
  children,
}: {
  onClick: () => void;
  label: string;
  active?: boolean;
  destructive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        onClick={onClick}
        className={cn(
          "group relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150 hover:bg-primary/10 hover:scale-110 cursor-pointer",
          active
            ? "bg-primary/10 text-primary"
            : destructive
              ? "text-destructive hover:bg-destructive/10 hover:text-destructive"
              : "text-muted-foreground hover:text-primary"
        )}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function GradingToolbar({
  disabled,
  essayText,
  onClear,
  tone,
  onToneChange,
  gradeLevelOverride,
  onGradeLevelChange,
  userGradeLevel,
  onUploadEssayFile,
  onStatsToggle,
}: GradingToolbarProps) {
  const navigate = useNavigate();
  const rubricFile = useAppStore((s) => s.rubricFile);
  const [rubricModalOpen, setRubricModalOpen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    return () => {
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
    };
  }, []);

  function handleStatsToggle() {
    const next = !showStats;
    setShowStats(next);
    onStatsToggle(next);
  }

  function handleClear() {
    if (confirmClear) {
      onClear();
      setConfirmClear(false);
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
    } else {
      setConfirmClear(true);
      clearTimeoutRef.current = setTimeout(() => {
        setConfirmClear(false);
      }, 2000);
    }
  }

  return (
    <>
      <div
        className={cn(
          "flex flex-col items-center w-12 bg-muted/30 border-l py-2 gap-1 shrink-0",
          disabled && "opacity-60 pointer-events-none"
        )}
      >
        {/* Upload section */}
        <ToolbarButton
          onClick={() => setRubricModalOpen(true)}
          label="Upload Rubric"
        >
          <BookOpen className="h-5 w-5 transition-all group-hover:h-[22px] group-hover:w-[22px]" />
          {rubricFile && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green-500" />
          )}
        </ToolbarButton>

        <ToolbarButton onClick={onUploadEssayFile} label="Upload Essay">
          <FileUp className="h-5 w-5 transition-all group-hover:h-[22px] group-hover:w-[22px]" />
        </ToolbarButton>

        {/* Divider */}
        <div className="w-6 border-b my-1" />

        {/* Main tools */}
        <ToolbarButton
          onClick={handleStatsToggle}
          label="Word Stats"
          active={showStats}
        >
          <BarChart3 className="h-5 w-5 transition-all group-hover:h-[22px] group-hover:w-[22px]" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => navigate("/history")}
          label="History"
        >
          <Clock className="h-5 w-5 transition-all group-hover:h-[22px] group-hover:w-[22px]" />
        </ToolbarButton>

        <ToolbarButton
          onClick={handleClear}
          label={confirmClear ? "Click again to clear" : "Clear"}
          destructive={confirmClear}
        >
          <Eraser className="h-5 w-5 transition-all group-hover:h-[22px] group-hover:w-[22px]" />
        </ToolbarButton>

        {/* Divider */}
        <div className="w-6 border-b my-1" />

        {/* Tone & Settings (these render their own Popover+Tooltip) */}
        <ToneSelector tone={tone} onToneChange={onToneChange} />

        <GradingSettings
          gradeLevelOverride={gradeLevelOverride}
          onGradeLevelChange={onGradeLevelChange}
          userGradeLevel={userGradeLevel}
        />
      </div>

      <RubricModal
        open={rubricModalOpen}
        onOpenChange={setRubricModalOpen}
      />
    </>
  );
}
