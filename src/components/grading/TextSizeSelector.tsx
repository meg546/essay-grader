import { useState } from "react";
import { ALargeSmall } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import type { TextSize } from "@/stores/app-store";
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

const TEXT_SIZE_OPTIONS: { value: TextSize; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "normal", label: "Normal" },
  { value: "large", label: "Large" },
];

export function TextSizeSelector() {
  const textSize = useAppStore((s) => s.textSize);
  const setTextSize = useAppStore((s) => s.setTextSize);
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <PopoverTrigger
          render={
            <TooltipTrigger
              className={cn(
                "group relative flex items-center justify-center w-10 h-10 rounded-lg transition-[colors,transform] duration-150 hover:bg-primary/10 hover:scale-110 cursor-pointer focus-visible:ring-2 focus-visible:ring-ring",
                "text-muted-foreground hover:text-primary"
              )}
            />
          }
        >
          <ALargeSmall
            aria-hidden="true"
            className="h-5 w-5 transition-[width,height] group-hover:h-[22px] group-hover:w-[22px]"
          />
        </PopoverTrigger>
        <TooltipContent>Text Size</TooltipContent>
      </Tooltip>
      <PopoverContent side="left" align="start" className="w-auto p-1.5">
        <div className="flex flex-col gap-0.5">
          {TEXT_SIZE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              aria-pressed={textSize === value}
              onClick={() => {
                setTextSize(value);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors",
                textSize === value
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
