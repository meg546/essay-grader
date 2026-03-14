import { apiClient } from './client'

export interface SuggestionRequest {
  flaggedText: string
  sentenceContext: string
  category: string
}

export interface SuggestionResponse {
  message: string
  suggestions: string[]
}

export async function fetchSuggestions(req: SuggestionRequest): Promise<SuggestionResponse> {
  const response = await apiClient.post<SuggestionResponse>('/suggestions', req)
  return response.data
}
