import { delay } from "./delay";
import { mockGradingResult } from "./mock-data";
import type { GradeEssayRequest, GradingResult } from "./types";

export async function gradeEssay(
  request: GradeEssayRequest,
): Promise<GradingResult> {
  await delay(1500);
  const baseSummary = mockGradingResult.summary;
  const summary = request.rubricText
    ? `Graded against uploaded rubric. ${baseSummary}`
    : baseSummary;
  return {
    ...mockGradingResult,
    id: crypto.randomUUID(),
    essayText: request.essayText,
    essayExcerpt: request.essayText.slice(0, 120) + "...",
    summary,
    gradedAt: new Date().toISOString(),
  };
}

