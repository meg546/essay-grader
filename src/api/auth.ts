import { apiClient } from "./client";

interface TokenResponse {
  access_token: string;
  token_type: string;
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
