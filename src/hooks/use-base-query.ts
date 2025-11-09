import {
    useQuery,
    type QueryKey,
    type UseQueryOptions,
    type UseQueryResult,
} from "@tanstack/react-query";
import type { AxiosRequestConfig } from "axios";

import { baseapi, parseApiError, type BaseApiError } from "@/lib/baseapi";

export function createBaseFetcher<TResponse>(config: AxiosRequestConfig): () => Promise<TResponse> {
  return async () => {
    const response = await baseapi.request<TResponse>(config);
    return response.data;
  };
}

export function useBaseQuery<TResponse>(
  queryKey: QueryKey,
  config: AxiosRequestConfig,
  options?: Omit<UseQueryOptions<TResponse, BaseApiError, TResponse, QueryKey>, "queryKey" | "queryFn">,
): UseQueryResult<TResponse, BaseApiError> {
  return useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const { data } = await baseapi.request<TResponse>(config);
        return data;
      } catch (error) {
        throw parseApiError(error);
      }
    },
    ...options,
  });
}
