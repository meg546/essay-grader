export interface HighlightRange {
  start: number;
  end: number;
  categoryId: string;
  type: "strength" | "improvement";
  feedback: string;
}

export interface CategoryScore {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  strengths: string[];
  improvements: string[];
  justification: string;
  highlights: HighlightRange[];
}

export interface GradingResult {
  id: string;
  essayText: string;
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
