import { apiClient } from "./client";
import type { GradingResult, HistoryItem } from "./types";

export async function getHistory(): Promise<HistoryItem[]> {
  const { data } = await apiClient.get<HistoryItem[]>("/history");
  return data;
}

export async function getHistoryItem(id: string): Promise<GradingResult> {
  const { data } = await apiClient.get<GradingResult>(`/history/${id}`);
  return data;
}
