import { apiClient } from "./client";

export type CoachContext =
  | "results_received"
  | "idle_nudge"
  | "history_visit"
  | "on_demand"
  | "greeting";

interface CoachResponse {
  message: string;
  foxState: string;
}

export async function getCoachingTip(
  context: CoachContext,
  submissionId?: string
): Promise<CoachResponse> {
  const { data } = await apiClient.post<CoachResponse>("/coach", {
    context,
    submissionId,
  });
  return data;
}
