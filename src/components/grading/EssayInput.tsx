import { useRef, useState, useCallback } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/stores/app-store";
import { extractTextFromPdf } from "@/lib/pdf-extract";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    const text = await extractTextFromPdf(file);
    if (!text) {
      toast.error(
        "Could not extract text from this PDF. Try pasting the text directly."
      );
      return "";
    }
    return text;
  }

  toast.error("Only .txt and .pdf files are supported");
  return "";
}

export function EssayInput() {
  const essayText = useAppStore((s) => s.essayText);
  const setEssayText = useAppStore((s) => s.setEssayText);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);

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
      // Reset input so the same file can be re-selected
      e.target.value = "";
    },
    [handleFile]
  );

  const wordCount = essayText.trim()
    ? essayText.trim().split(/\s+/).length
    : 0;
  const charCount = essayText.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Essay</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`rounded-md transition-all ${
            isDragOver ? "ring-2 ring-primary border-primary" : ""
          }`}
        >
          <Textarea
            value={essayText}
            onChange={(e) => setEssayText(e.target.value)}
            placeholder="Paste your essay here or drag and drop a file..."
            className="h-64 resize-none overflow-y-auto"
          />
        </div>

        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload File
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>

        <p className="text-sm text-muted-foreground">
          {wordCount.toLocaleString()} words &middot;{" "}
          {charCount.toLocaleString()} characters
        </p>
      </CardContent>
    </Card>
  );
}
