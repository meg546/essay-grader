import { Link } from "react-router";
import { GraduationCapIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function LandingPage() {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <GraduationCapIcon className="mb-6 h-16 w-16 text-primary" />
      <h1 className="text-4xl font-bold tracking-tight">EssayGrader</h1>
      <p className="mt-2 text-xl text-muted-foreground">
        AI-powered essay feedback in seconds
      </p>

      <p className="mx-auto mt-6 max-w-md text-muted-foreground">
        Upload your essay and optionally add a rubric from your assignment.
        Get scored feedback with strengths, areas for improvement, and
        detailed justification for each category.
      </p>

      <Link
        to="/grade"
        className={buttonVariants({ size: "lg", className: "mt-8" })}
      >
        Grade an Essay
      </Link>
    </div>
  );
}
