import { useState } from "react";
import { Link } from "react-router";
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
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { RubricModal } from "./RubricModal";
import { EssayUploadModal } from "./EssayUploadModal";
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
          "group relative flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-150 hover:bg-primary/10 hover:scale-110 cursor-pointer",
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
  const rubricFile = useAppStore((s) => s.rubricFile);
  const [rubricModalOpen, setRubricModalOpen] = useState(false);
  const [essayModalOpen, setEssayModalOpen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);

  function handleStatsToggle() {
    const next = !showStats;
    setShowStats(next);
    onStatsToggle(next);
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
          <BookOpen aria-hidden="true" className="h-5 w-5 transition-[width,height] group-hover:h-[22px] group-hover:w-[22px]" />
          {rubricFile && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green-500" />
          )}
        </ToolbarButton>

        <ToolbarButton onClick={() => setEssayModalOpen(true)} label="Upload Essay">
          <FileUp aria-hidden="true" className="h-5 w-5 transition-[width,height] group-hover:h-[22px] group-hover:w-[22px]" />
        </ToolbarButton>

        {/* Divider */}
        <div className="w-6 border-b my-1" />

        {/* Main tools */}
        <ToolbarButton
          onClick={handleStatsToggle}
          label="Word Stats"
          active={showStats}
        >
          <BarChart3 aria-hidden="true" className="h-5 w-5 transition-[width,height] group-hover:h-[22px] group-hover:w-[22px]" />
        </ToolbarButton>

        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/history"
              className="group relative flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-150 hover:bg-primary/10 hover:scale-110 text-muted-foreground hover:text-primary cursor-pointer"
            >
              <Clock aria-hidden="true" className="h-5 w-5 transition-[width,height] group-hover:h-[22px] group-hover:w-[22px]" />
            </Link>
          </TooltipTrigger>
          <TooltipContent>History</TooltipContent>
        </Tooltip>

        <Popover open={clearOpen} onOpenChange={setClearOpen}>
          <Tooltip>
            <PopoverTrigger
              render={
                <TooltipTrigger className="group relative flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-150 hover:bg-primary/10 hover:scale-110 text-muted-foreground hover:text-primary cursor-pointer" />
              }
            >
              <Eraser aria-hidden="true" className="h-5 w-5 transition-[width,height] group-hover:h-[22px] group-hover:w-[22px]" />
            </PopoverTrigger>
            <TooltipContent>Clear</TooltipContent>
          </Tooltip>
          <PopoverContent side="left" align="start" className="w-auto max-w-[11rem] p-3">
            <p className="text-xs text-muted-foreground mb-2">
              Clear essay and rubric?
            </p>
            <button
              onClick={() => {
                onClear();
                setClearOpen(false);
              }}
              className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Confirm
            </button>
          </PopoverContent>
        </Popover>

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
      <EssayUploadModal
        open={essayModalOpen}
        onOpenChange={setEssayModalOpen}
      />
    </>
  );
}
