import { useRef, useState, useCallback } from "react";
import { Upload, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/stores/app-store";
import { extractTextFromPdf } from "@/lib/pdf-extract";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface EssayUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTextLoaded?: (text: string) => void;
}

async function readFileAsText(file: File): Promise<string> {
  const ext = file.name.toLowerCase().split(".").pop();

  if (ext === "txt") {
    return file.text();
  }

  if (ext === "pdf") {
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

export function EssayUploadModal({ open, onOpenChange, onTextLoaded }: EssayUploadModalProps) {
  const setEssayText = useAppStore((s) => s.setEssayText);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const dragCounterRef = useRef(0);

  const handleFile = useCallback(
    async (file: File) => {
      const ext = file.name.toLowerCase().split(".").pop();
      if (ext !== "txt" && ext !== "pdf") {
        toast.error("Only .txt and .pdf files are supported");
        return;
      }
      setSelectedFile(file);
      const text = await readFileAsText(file);
      if (text) {
        setEssayText(text);
        onTextLoaded?.(text);
        toast.success("Essay uploaded");
        onOpenChange(false);
        setSelectedFile(null);
      }
    },
    [setEssayText, onTextLoaded, onOpenChange]
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
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setSelectedFile(null); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Essay</DialogTitle>
          <DialogDescription>
            Upload your essay file (.txt or .pdf)
          </DialogDescription>
        </DialogHeader>

        {selectedFile ? (
          <div className="mt-4">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <FileText aria-hidden="true" className="h-5 w-5 text-muted-foreground" />
              <span className="flex-1 truncate text-sm">{selectedFile.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                aria-label="Remove file"
                onClick={() => setSelectedFile(null)}
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Extracting text…
            </p>
          </div>
        ) : (
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={cn(
              "mt-4 flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25"
            )}
          >
            <Upload aria-hidden="true" className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                Drag and drop your essay here
              </p>
              <p className="text-xs text-muted-foreground">
                .txt or .pdf
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
          accept=".txt,.pdf"
          aria-label="Upload essay file"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  );
}
