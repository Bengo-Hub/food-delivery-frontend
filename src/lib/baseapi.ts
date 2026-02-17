import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export const baseapi = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: true,
});

baseapi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const tenantId = localStorage.getItem("tenantId");
    if (tenantId) {
      config.headers.set("x-tenant-id", tenantId);
    }
    const tenantSlug = localStorage.getItem("tenantSlug");
    if (tenantSlug) {
      config.headers.set("x-tenant-slug", tenantSlug);
    }
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
    const result: BaseApiError = {
      message: error.response?.data?.message ?? error.message,
      code: error.response?.data?.code ?? error.code,
      details: error.response?.data,
    };
    if (error.response?.status !== undefined) {
      result.status = error.response.status;
    }
    return result;
  }

  return {
    message: "Something went wrong. Please try again.",
  };
}
