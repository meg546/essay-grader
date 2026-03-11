import type { CategoryScore, HighlightRange } from "@/api/types";

// --- Types ---

export interface TextSegment {
  kind: "text";
  text: string;
}

export interface HighlightSegment {
  kind: "highlight";
  text: string;
  id: string;
  categoryId: string;
  type: "strength" | "improvement";
  feedback: string;
}

export type Segment = TextSegment | HighlightSegment;

export interface CategoryColor {
  bg: string;
  bgActive: string;
  text: string;
}

// --- Constants ---

/**
 * Static Tailwind class strings to avoid purge issues.
 * 6 palette entries cycled via modulo.
 */
export const CATEGORY_COLORS: CategoryColor[] = [
  { bg: "bg-blue-100 dark:bg-blue-900/40", bgActive: "bg-blue-200 dark:bg-blue-800/60", text: "text-blue-700 dark:text-blue-300" },
  { bg: "bg-purple-100 dark:bg-purple-900/40", bgActive: "bg-purple-200 dark:bg-purple-800/60", text: "text-purple-700 dark:text-purple-300" },
  { bg: "bg-orange-100 dark:bg-orange-900/40", bgActive: "bg-orange-200 dark:bg-orange-800/60", text: "text-orange-700 dark:text-orange-300" },
  { bg: "bg-teal-100 dark:bg-teal-900/40", bgActive: "bg-teal-200 dark:bg-teal-800/60", text: "text-teal-700 dark:text-teal-300" },
  { bg: "bg-pink-100 dark:bg-pink-900/40", bgActive: "bg-pink-200 dark:bg-pink-800/60", text: "text-pink-700 dark:text-pink-300" },
  { bg: "bg-yellow-100 dark:bg-yellow-900/40", bgActive: "bg-yellow-200 dark:bg-yellow-800/60", text: "text-yellow-700 dark:text-yellow-300" },
];

/**
 * Hex color values for category borders/accents (matches CATEGORY_COLORS order).
 */
export const CATEGORY_HEX: string[] = [
  "#3b82f6", // blue
  "#a855f7", // purple
  "#f97316", // orange
  "#14b8a6", // teal
  "#ec4899", // pink
  "#eab308", // yellow
];

// --- Functions ---

/** Get color palette for a category by index (wraps around). */
export function getCategoryColor(index: number): CategoryColor {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}

/** Map each category's id to its positional index for stable color assignment. */
export function buildCategoryColorMap(
  categories: CategoryScore[],
): Map<string, number> {
  const map = new Map<string, number>();
  categories.forEach((cat, i) => map.set(cat.id, i));
  return map;
}

/** Collect all highlights across categories, sorted by start offset. */
export function getAllHighlights(
  categories: CategoryScore[],
): HighlightRange[] {
  return categories
    .flatMap((cat) => cat.highlights)
    .sort((a, b) => a.start - b.start || a.end - b.end);
}

/**
 * Convert essay text + highlight ranges into an ordered Segment array.
 *
 * Overlaps: priority goes to the first highlight by start offset (then array order).
 * If a later highlight starts before the current cursor, it is skipped/truncated.
 * Highlights whose categoryId is in disabledCategories are filtered out before processing.
 */
export function buildSegments(
  essayText: string,
  highlights: HighlightRange[],
  disabledCategories: Set<string>,
): Segment[] {
  // Filter out disabled categories
  const active = highlights.filter(
    (h) => !disabledCategories.has(h.categoryId),
  );

  // Sort by start, then end (shorter first for tie-breaking)
  const sorted = [...active].sort(
    (a, b) => a.start - b.start || a.end - b.end,
  );

  const segments: Segment[] = [];
  let cursor = 0;

  for (const hl of sorted) {
    // Skip highlights that are entirely behind the cursor (overlap case)
    if (hl.end <= cursor) continue;

    // Effective start is at least at cursor (truncate overlapping start)
    const effectiveStart = Math.max(hl.start, cursor);

    // Add plain text before this highlight
    if (effectiveStart > cursor) {
      segments.push({
        kind: "text",
        text: essayText.slice(cursor, effectiveStart),
      });
    }

    // Clamp end to essay length
    const effectiveEnd = Math.min(hl.end, essayText.length);

    segments.push({
      kind: "highlight",
      text: essayText.slice(effectiveStart, effectiveEnd),
      id: `${hl.categoryId}-${hl.start}`,
      categoryId: hl.categoryId,
      type: hl.type,
      feedback: hl.feedback,
    });

    cursor = effectiveEnd;
  }

  // Remaining plain text after last highlight
  if (cursor < essayText.length) {
    segments.push({
      kind: "text",
      text: essayText.slice(cursor),
    });
  }

  return segments;
}
