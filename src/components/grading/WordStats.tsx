interface WordStatsProps {
  essayText: string;
  visible: boolean;
}

export function WordStats({ essayText, visible }: WordStatsProps) {
  if (!visible) return null;

  const words = essayText.trim() ? essayText.trim().split(/\s+/).length : 0;
  const characters = essayText.length;
  const paragraphs = essayText.trim()
    ? essayText.trim().split(/\n\s*\n/).length
    : 0;
  const readingTime = Math.max(1, Math.ceil(words / 200));

  return (
    <div className="flex items-center gap-6 h-8 bg-muted/50 rounded-b-lg px-4 text-xs text-muted-foreground transition-colors duration-200 border-t shrink-0">
      <span>{words.toLocaleString()} words</span>
      <span>{characters.toLocaleString()} characters</span>
      <span>{paragraphs} {paragraphs === 1 ? "paragraph" : "paragraphs"}</span>
      <span>{readingTime} min read</span>
    </div>
  );
}
