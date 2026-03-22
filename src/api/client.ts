import axios from "axios";
import { useProfileStore } from "@/stores/profile-store";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  timeout: 120_000,
});

apiClient.interceptors.request.use((config) => {
  const token = useProfileStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      useProfileStore.getState().signOut();
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);
