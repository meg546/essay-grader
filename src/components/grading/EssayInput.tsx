import { useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { CharacterCount } from "@tiptap/extension-character-count";
import { toast } from "sonner";
import { useAppStore } from "@/stores/app-store";
import { extractTextFromPdf } from "@/lib/pdf-extract";
import { cn } from "@/lib/utils";
import type { TextSize } from "@/stores/app-store";

const TEXT_SIZE_CLASS: Record<TextSize, string> = {
  small: "text-sm md:text-sm",
  normal: "text-base md:text-base",
  large: "text-lg md:text-lg",
} as const;

export interface EssayInputHandle {
  triggerFileUpload: () => void;
  loadContent: (text: string) => void;
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
    const textSize = useAppStore((s) => s.textSize);
    // Read once at mount — NOT reactive (one-way sync only)
    const initialText = useAppStore.getState().essayText;

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const dragCounterRef = useRef(0);

    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          bold: false,
          italic: false,
          strike: false,
          code: false,
          codeBlock: false,
          blockquote: false,
          heading: false,
          horizontalRule: false,
          bulletList: false,
          orderedList: false,
        }),
        CharacterCount,
      ],
      content: initialText
        ? `<p>${initialText.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>`
        : "",
      onUpdate({ editor }) {
        // Use getState() to avoid stale closure on setEssayText (Pitfall 3)
        useAppStore.getState().setEssayText(editor.getText({ blockSeparator: "\n\n" }));
      },
      onFocus() {
        onFocus?.();
      },
      editorProps: {
        attributes: {
          class: cn(
            "outline-none flex-1 p-4 leading-relaxed min-h-[250px] md:min-h-[200px]",
            TEXT_SIZE_CLASS[textSize]
          ),
          "aria-label": "Essay text",
        },
      },
    });

    // Update editorProps when textSize changes (reactive class update)
    if (editor) {
      editor.setOptions({
        editorProps: {
          attributes: {
            class: cn(
              "outline-none flex-1 p-4 leading-relaxed min-h-[250px] md:min-h-[200px]",
              TEXT_SIZE_CLASS[textSize]
            ),
            "aria-label": "Essay text",
          },
        },
      });
    }

    useImperativeHandle(ref, () => ({
      triggerFileUpload: () => fileInputRef.current?.click(),
      loadContent: (text: string) => {
        if (editor) {
          const html = `<p>${text.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>`;
          editor.commands.setContent(html);
        }
        // Keep store in sync (belt-and-suspenders with modal's setEssayText)
        useAppStore.getState().setEssayText(text);
      },
    }), [editor]);

    const handleFile = useCallback(
      async (file: File) => {
        const ext = getFileExtension(file.name);
        if (!SUPPORTED_EXTENSIONS.has(ext)) {
          toast.error("Only .txt and .pdf files are supported");
          return;
        }
        const text = await readFileAsText(file);
        if (text) {
          // Update store
          useAppStore.getState().setEssayText(text);
          // Also update editor content — this is the ONE exception to "no setContent after mount"
          // It is an explicit user file load action, not a reactive sync loop
          if (editor) {
            const html = `<p>${text.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>`;
            editor.commands.setContent(html);
          }
        }
      },
      [editor]
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
        <EditorContent
          editor={editor}
          className="flex-1 min-h-0 overflow-y-auto flex flex-col [&_.tiptap]:flex-1 [&_.tiptap]:flex [&_.tiptap]:flex-col [&_.tiptap.is-empty]:before:content-['Paste_your_essay_here_or_drag_and_drop_a_file...'] [&_.tiptap.is-empty]:before:text-muted-foreground [&_.tiptap.is-empty]:before:pointer-events-none [&_.tiptap.is-empty]:before:float-left [&_.tiptap.is-empty]:before:h-0 [&_.tiptap.is-empty]:before:w-full"
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
