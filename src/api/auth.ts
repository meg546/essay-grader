import { apiClient } from "./client";

interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserProfile {
  id: string;
  email: string;
  createdAt: string;
  gradeLevel: string | null;
  writingPurpose: string | null;
}

export async function login(
  email: string,
  password: string
): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>("/auth/login", {
    email,
    password,
  });
  return data;
}

export async function register(
  email: string,
  password: string
): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>("/auth/register", {
    email,
    password,
  });
  return data;
}

export async function getMe(): Promise<UserProfile> {
  const { data } = await apiClient.get<UserProfile>("/auth/me");
  return data;
}

export async function updateProfile(
  updates: { gradeLevel?: string; writingPurpose?: string }
): Promise<UserProfile> {
  const { data } = await apiClient.patch<UserProfile>("/auth/me", updates);
  return data;
}
