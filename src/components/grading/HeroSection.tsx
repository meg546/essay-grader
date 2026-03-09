import { FileText, Sparkles, Zap } from "lucide-react";

export function HeroSection() {
  return (
    <section className="py-12 text-center">
      <h1 className="text-3xl font-bold tracking-tight">EssayGrader</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        AI-powered essay feedback in seconds
      </p>
      <div className="mt-6 flex items-center justify-center gap-4">
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Zap className="h-4 w-4" />
          Instant AI Feedback
        </span>
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          Rubric-Aligned Scoring
        </span>
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          Highlighted Passages
        </span>
      </div>
    </section>
  );
}
