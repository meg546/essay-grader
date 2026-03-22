import { useState } from "react";
import { MessageSquare } from "lucide-react";
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

const TONES = ["Academic", "Professional", "Casual", "Creative"] as const;

interface ToneSelectorProps {
  tone: string;
  onToneChange: (tone: string) => void;
}

export function ToneSelector({ tone, onToneChange }: ToneSelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <PopoverTrigger
          render={
            <TooltipTrigger
              className="group relative flex items-center justify-center w-10 h-10 rounded-lg transition-[colors,transform] duration-150 hover:bg-primary/10 hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring text-muted-foreground hover:text-primary cursor-pointer"
            />
          }
        >
          <MessageSquare aria-hidden="true" className="h-5 w-5 transition-[width,height] group-hover:h-[22px] group-hover:w-[22px]" />
          <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-primary/10 text-[8px] font-bold text-primary uppercase">
            {tone[0]}
          </span>
        </PopoverTrigger>
        <TooltipContent>Tone</TooltipContent>
      </Tooltip>

      <PopoverContent side="left" align="start" className="w-auto min-w-[10rem]">
        <p className="text-xs font-medium text-muted-foreground mb-2">
          Feedback Tone
        </p>
        <div className="flex flex-col gap-1.5">
          {TONES.map((t) => (
            <button
              key={t}
              onClick={() => {
                onToneChange(t.toLowerCase());
                setOpen(false);
              }}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring text-center",
                tone.toLowerCase() === t.toLowerCase()
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
