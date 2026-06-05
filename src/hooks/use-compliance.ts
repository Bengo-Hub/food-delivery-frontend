"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createDataSubjectRequest,
  listDataSubjectRequests,
  requestDataDeletion,
  requestDataExport,
  type CreateDataSubjectRequestBody,
  type DataSubjectRequestListParams,
  type DataSubjectRequestListResult,
  type RequestDataDeletionBody,
  type RequestDataExportBody,
} from "@/lib/api/compliance";
import { useOrgSlug } from "@/providers/org-slug-provider";

// ─── Query Keys ──────────────────────────────────────────────────────

export const complianceKeys = {
  all: ["compliance"] as const,
  requests: (slug: string, params: DataSubjectRequestListParams) =>
    [...complianceKeys.all, "dsr", slug, params] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────

/** List the current user's data subject requests. */
export function useDataSubjectRequests(params: DataSubjectRequestListParams = {}) {
  const slug = useOrgSlug();
  return useQuery<DataSubjectRequestListResult>({
    queryKey: complianceKeys.requests(slug, params),
    queryFn: () => listDataSubjectRequests(slug, params),
    enabled: !!slug,
    staleTime: 30_000,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────

/** Create a data subject request, invalidating the DSR list on success. */
export function useCreateDataSubjectRequest() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateDataSubjectRequestBody) =>
      createDataSubjectRequest(slug, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.all });
    },
  });
}

/** Request a data export job, invalidating the DSR list on success. */
export function useRequestDataExport() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: RequestDataExportBody) => requestDataExport(slug, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.all });
    },
  });
}

/** Request a data deletion job, invalidating the DSR list on success. */
export function useRequestDataDeletion() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: RequestDataDeletionBody) => requestDataDeletion(slug, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.all });
    },
  });
}
