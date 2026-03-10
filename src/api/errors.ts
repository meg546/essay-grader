import axios from "axios";

export function getErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return "Something went wrong. Please try again.";
  }

  if (error.code === "ECONNABORTED") {
    return "Request timed out. Please try again.";
  }

  if (!error.response) {
    return "Could not reach the server.";
  }

  const { status, data } = error.response;

  if (status === 409) {
    return data?.detail || "Conflict.";
  }

  if (status === 422) {
    const detail = data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length > 0) return detail[0].msg;
    return "Invalid input. Please check your data.";
  }

  return "Something went wrong. Please try again.";
}
