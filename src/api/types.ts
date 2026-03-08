export interface RubricCategory {
  name: string;
  maxScore: number;
}

export interface GradeEssayRequest {
  essayText: string;
  rubric: RubricCategory[];
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
