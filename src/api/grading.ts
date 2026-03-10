import { apiClient } from "./client";
import type { GradingResult } from "./types";

export async function gradeEssay(
  essayText: string,
  gradeLevel: string,
  rubricFile?: File | null,
  rubricText?: string,
): Promise<GradingResult> {
  const formData = new FormData();
  formData.append("essay_text", essayText);
  formData.append("grade_level", gradeLevel);

  if (rubricFile) {
    formData.append("rubric_file", rubricFile);
  } else if (rubricText) {
    formData.append("rubric_text", rubricText);
  }

  const { data } = await apiClient.post<GradingResult>("/grade", formData);
  return data;
}
