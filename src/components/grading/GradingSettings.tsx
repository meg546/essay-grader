import { useState } from "react";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { GRADE_LEVEL_LABELS, type GradeLevel } from "@/stores/profile-store";
import { useAppStore, type TextSize } from "@/stores/app-store";

interface GradingSettingsProps {
  gradeLevelOverride: string | null;
  onGradeLevelChange: (level: string | null) => void;
  userGradeLevel: string | null;
}

const GRADE_LEVELS = Object.entries(GRADE_LEVEL_LABELS) as [GradeLevel, string][];

const TEXT_SIZE_OPTIONS: { value: TextSize; label: string; aClass: string }[] = [
  { value: "small", label: "Small", aClass: "text-xs" },
  { value: "normal", label: "Normal", aClass: "text-sm" },
  { value: "large", label: "Large", aClass: "text-base" },
];

export function GradingSettings({
  gradeLevelOverride,
  onGradeLevelChange,
  userGradeLevel,
}: GradingSettingsProps) {
  const [open, setOpen] = useState(false);
  const effectiveLevel = gradeLevelOverride || userGradeLevel || "college";
  const isOverridden = gradeLevelOverride !== null;

  const textSize = useAppStore((s) => s.textSize);
  const setTextSize = useAppStore((s) => s.setTextSize);

  const showReset = isOverridden || textSize !== "normal";

  function handleReset() {
    onGradeLevelChange(null);
    setTextSize("normal");
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <PopoverTrigger
          render={
            <TooltipTrigger
              className="group relative flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-150 hover:bg-primary/10 hover:scale-110 text-muted-foreground hover:text-primary cursor-pointer"
            />
          }
        >
          <Settings aria-hidden="true" className="h-5 w-5 transition-[width,height] group-hover:h-[22px] group-hover:w-[22px]" />
          {isOverridden && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
          )}
        </PopoverTrigger>
        <TooltipContent>Settings</TooltipContent>
      </Tooltip>

      <PopoverContent side="left" align="start" className="w-56">
        <p className="text-xs font-medium text-muted-foreground mb-2">
          For this submission only
        </p>
        <Select
          value={effectiveLevel}
          onValueChange={(val) => onGradeLevelChange(val as string)}
        >
          <SelectTrigger className="w-full" aria-label="Grading settings">
            <SelectValue>
              {GRADE_LEVEL_LABELS[effectiveLevel as GradeLevel] || effectiveLevel}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {GRADE_LEVELS.map(([value, label]) => (
              <SelectItem key={value} value={value} label={label}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="mt-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Text Size
          </p>
          <div className="flex rounded-lg border border-border overflow-hidden">
            {TEXT_SIZE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setTextSize(option.value)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-0.5 py-1.5 transition-colors",
                  textSize === option.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent text-muted-foreground hover:bg-muted"
                )}
                aria-label={`Text size: ${option.label}`}
                aria-pressed={textSize === option.value}
              >
                <span className={cn("font-medium leading-none", option.aClass)}>A</span>
                <span className="text-[10px] leading-none">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {showReset && (
          <button
            onClick={handleReset}
            className={cn(
              "mt-2 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
            )}
          >
            Reset to profile default
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
