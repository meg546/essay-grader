import { delay } from "./delay";
import { getMockGradingResultById, mockHistoryItems } from "./mock-data";
import type { GradingResult, HistoryItem } from "./types";

export async function getHistory(): Promise<HistoryItem[]> {
  await delay(800);
  return mockHistoryItems;
}

export async function getHistoryItem(id: string): Promise<GradingResult> {
  await delay(600);
  return getMockGradingResultById(id);
}
