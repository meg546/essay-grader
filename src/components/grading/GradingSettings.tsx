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

interface GradingSettingsProps {
  gradeLevelOverride: string | null;
  onGradeLevelChange: (level: string | null) => void;
  userGradeLevel: string | null;
}

const GRADE_LEVELS = Object.entries(GRADE_LEVEL_LABELS) as [GradeLevel, string][];

export function GradingSettings({
  gradeLevelOverride,
  onGradeLevelChange,
  userGradeLevel,
}: GradingSettingsProps) {
  const [open, setOpen] = useState(false);
  const effectiveLevel = gradeLevelOverride || userGradeLevel || "college";
  const isOverridden = gradeLevelOverride !== null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <PopoverTrigger
          render={
            <TooltipTrigger
              className="group relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150 hover:bg-primary/10 hover:scale-110 text-muted-foreground hover:text-primary cursor-pointer"
            />
          }
        >
          <Settings className="h-5 w-5 transition-all group-hover:h-[22px] group-hover:w-[22px]" />
          {isOverridden && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
          )}
        </PopoverTrigger>
        <TooltipContent>Settings</TooltipContent>
      </Tooltip>

      <PopoverContent side="left" align="start" className="w-52">
        <p className="text-xs font-medium text-muted-foreground mb-2">
          For this submission only
        </p>
        <Select
          value={effectiveLevel}
          onValueChange={(val) => onGradeLevelChange(val as string)}
        >
          <SelectTrigger className="w-full">
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
        {isOverridden && (
          <button
            onClick={() => onGradeLevelChange(null)}
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
