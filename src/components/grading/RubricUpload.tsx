import { useRef, useState, useCallback } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/stores/app-store";
import { extractTextFromPdf } from "@/lib/pdf-extract";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface RubricUploadProps {
  disabled?: boolean;
}

export function RubricUpload({ disabled }: RubricUploadProps) {
  const rubricFile = useAppStore((s) => s.rubricFile);
  const setRubricFile = useAppStore((s) => s.setRubricFile);
  const setRubricText = useAppStore((s) => s.setRubricText);
  const rubricText = useAppStore((s) => s.rubricText);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const dragCounterRef = useRef(0);

  const handleFile = useCallback(
    async (file: File) => {
      const ext = file.name.toLowerCase().split(".").pop();
      if (ext !== "pdf") {
        toast.error("Only PDF rubrics are supported");
        return;
      }
      setRubricFile(file);
      setIsExtracting(true);
      try {
        const text = await extractTextFromPdf(file);
        if (text === "") {
          toast.error(
            "Could not extract text from this PDF. The file may be image-based."
          );
        } else {
          setRubricText(text);
          toast.success("Rubric text extracted");
        }
      } catch {
        toast.error("Failed to read rubric PDF");
      } finally {
        setIsExtracting(false);
      }
    },
    [setRubricFile, setRubricText]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (dragCounterRef.current === 1) setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) setIsDragOver(false);
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
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rubric (Optional)</CardTitle>
      </CardHeader>
      <CardContent className={cn(disabled && "opacity-60 pointer-events-none")}>
        {rubricFile ? (
          <div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="flex-1 truncate text-sm">{rubricFile.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setRubricFile(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {isExtracting ? (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Extracting text...
              </div>
            ) : rubricText ? (
              <div className="mt-3 max-h-32 overflow-y-auto rounded border bg-muted/50 p-3 text-xs text-muted-foreground whitespace-pre-wrap">
                {rubricText}
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                No text could be extracted from this PDF
              </p>
            )}
          </div>
        ) : (
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={cn(
              "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25"
            )}
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                Upload your assignment rubric
              </p>
              <p className="text-xs text-muted-foreground">
                PDF only — or skip and we'll grade based on your grade level
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose File
            </Button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}
