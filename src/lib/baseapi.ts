import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export const baseapi = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: true,
});

baseapi.interceptors.request.use((config) => {
  const tenantId = typeof window !== "undefined" ? localStorage.getItem("tenantId") : undefined;
  if (tenantId) {
    config.headers.set("x-tenant-id", tenantId);
  }

  return config;
});

export interface BaseApiError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

export function parseApiError(error: unknown): BaseApiError {
  if (axios.isAxiosError(error)) {
    return {
      message: error.response?.data?.message ?? error.message,
      code: error.response?.data?.code ?? error.code,
      status: error.response?.status,
      details: error.response?.data,
    };
  }

  return {
    message: "Something went wrong. Please try again.",
  };
}
