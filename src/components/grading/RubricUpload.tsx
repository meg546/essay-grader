import { useRef, useState, useCallback } from "react";
import { Upload, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/stores/app-store";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);

  const handleFile = useCallback(
    (file: File) => {
      const ext = file.name.toLowerCase().split(".").pop();
      if (ext !== "pdf") {
        toast.error("Only PDF rubrics are supported");
        return;
      }
      setRubricFile(file);
      toast.success("Rubric uploaded");
    },
    [setRubricFile]
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
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>Rubric (Optional)</CardTitle>
      </CardHeader>
      <CardContent className={cn("flex-1 flex flex-col", disabled && "opacity-60 pointer-events-none")}>
        {rubricFile ? (
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <FileText aria-hidden="true" className="h-5 w-5 text-muted-foreground" />
              <span className="flex-1 truncate text-sm">{rubricFile.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                aria-label="Remove rubric"
                onClick={() => setRubricFile(null)}
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Text will be extracted on submit
            </p>
          </div>
        ) : (
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25"
            )}
          >
            <Upload aria-hidden="true" className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                Upload your assignment rubric
              </p>
              <p className="text-xs text-muted-foreground">
                PDF only — or skip and we'll grade based on your grade level{"\u2026"}
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
          aria-label="Upload rubric file"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}
