"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type UpdatePreferencesRequest,
} from "@/lib/api/notifications";
import { useOrgSlug } from "@/providers/org-slug-provider";

export const notificationKeys = {
  all: ["notifications"] as const,
  preferences: () => [...notificationKeys.all, "preferences"] as const,
};

export function useNotificationPreferences() {
  const slug = useOrgSlug();
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: () => getNotificationPreferences(slug),
    staleTime: 5 * 60_000,
  });
}

export function useUpdateNotificationPreferences() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdatePreferencesRequest) =>
      updateNotificationPreferences(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.preferences() });
    },
  });
}
