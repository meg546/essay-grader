export interface GradeEssayRequest {
  essayText: string;
  rubricFile?: File;
  gradeLevel: string;
}

export interface CategoryScore {
  name: string;
  score: number;
  maxScore: number;
  strengths: string[];
  improvements: string[];
  justification: string;
}

export interface GradingResult {
  id: string;
  essayExcerpt: string;
  overallScore: number;
  maxScore: number;
  summary: string;
  categories: CategoryScore[];
  gradedAt: string;
}

export interface HistoryItem {
  id: string;
  essayExcerpt: string;
  overallScore: number;
  maxScore: number;
  categoryCount: number;
  gradedAt: string;
}
