import { delay } from "./delay";
import { mockGradingResult } from "./mock-data";
import type { GradeEssayRequest, GradingResult } from "./types";

export async function gradeEssay(
  request: GradeEssayRequest,
): Promise<GradingResult> {
  await delay(1500);
  return {
    ...mockGradingResult,
    id: crypto.randomUUID(),
    essayText: request.essayText,
    essayExcerpt: request.essayText.slice(0, 120) + "...",
    gradedAt: new Date().toISOString(),
  };
}

