import { useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/stores/app-store";
import { extractTextFromPdf } from "@/lib/pdf-extract";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

const TEXT_SIZE_CLASS = {
  small: "text-sm md:text-sm",
  normal: "text-base md:text-base",
  large: "text-lg md:text-lg",
} as const;

export interface EssayInputHandle {
  triggerFileUpload: () => void;
}

interface EssayInputProps {
  disabled?: boolean;
  onFocus?: () => void;
}

const SUPPORTED_EXTENSIONS = new Set([".txt", ".pdf"]);

function getFileExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex === -1 ? "" : filename.slice(dotIndex).toLowerCase();
}

async function readFileAsText(file: File): Promise<string> {
  const ext = getFileExtension(file.name);

  if (ext === ".txt") {
    return file.text();
  }

  if (ext === ".pdf") {
    try {
      const text = await extractTextFromPdf(file);
      if (!text) {
        toast.error(
          "Could not extract text from this PDF. Try pasting the text directly."
        );
        return "";
      }
      return text;
    } catch {
      toast.error("Failed to read PDF. Try pasting the text directly.");
      return "";
    }
  }

  toast.error("Only .txt and .pdf files are supported");
  return "";
}

export const EssayInput = forwardRef<EssayInputHandle, EssayInputProps>(
  function EssayInput({ disabled, onFocus }, ref) {
    const essayText = useAppStore((s) => s.essayText);
    const setEssayText = useAppStore((s) => s.setEssayText);
    const textSize = useAppStore((s) => s.textSize);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const dragCounterRef = useRef(0);

    useImperativeHandle(ref, () => ({
      triggerFileUpload: () => fileInputRef.current?.click(),
    }));

    const handleFile = useCallback(
      async (file: File) => {
        const ext = getFileExtension(file.name);
        if (!SUPPORTED_EXTENSIONS.has(ext)) {
          toast.error("Only .txt and .pdf files are supported");
          return;
        }
        const text = await readFileAsText(file);
        if (text) {
          setEssayText(text);
        }
      },
      [setEssayText]
    );

    const handleDragEnter = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current += 1;
      if (dragCounterRef.current === 1) {
        setIsDragOver(true);
      }
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current -= 1;
      if (dragCounterRef.current === 0) {
        setIsDragOver(false);
      }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    }, []);

    const handleDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current = 0;
        setIsDragOver(false);

        const file = e.dataTransfer.files[0];
        if (file) {
          handleFile(file);
        }
      },
      [handleFile]
    );

    const handleFileInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
          handleFile(file);
        }
        e.target.value = "";
      },
      [handleFile]
    );

    return (
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          "flex-1 flex flex-col min-h-0 transition-colors",
          isDragOver && "ring-2 ring-primary ring-inset",
          disabled && "opacity-60 pointer-events-none"
        )}
      >
        <Textarea
          value={essayText}
          onChange={(e) => setEssayText(e.target.value)}
          onFocus={onFocus}
          aria-label="Essay text"
          placeholder="Paste your essay here or drag and drop a file…"
          className={cn("flex-1 resize-none overflow-y-auto min-h-[250px] md:min-h-[200px] border-0 focus-visible:ring-2 rounded-none leading-relaxed p-4", TEXT_SIZE_CLASS[textSize])}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.pdf"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>
    );
  }
);
