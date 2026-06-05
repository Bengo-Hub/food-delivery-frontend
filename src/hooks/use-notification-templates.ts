"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createTemplate,
  deleteTemplate,
  getTemplate,
  listEvents,
  listTemplates,
  updateTemplate,
  type CreateTemplateRequest,
  type ListEventsParams,
  type ListTemplatesParams,
  type NotificationEvent,
  type NotificationTemplate,
  type UpdateTemplateRequest,
} from "@/lib/api/notifications";
import { useOrgSlug } from "@/providers/org-slug-provider";

// ─── Query Keys ──────────────────────────────────────────────────────

export const notificationKeys = {
  all: ["notifications"] as const,
  templates: (slug: string, params?: ListTemplatesParams) =>
    [...notificationKeys.all, "templates", slug, params ?? {}] as const,
  template: (slug: string, id: string) =>
    [...notificationKeys.all, "template", slug, id] as const,
  events: (slug: string, params?: ListEventsParams) =>
    [...notificationKeys.all, "events", slug, params ?? {}] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────

/** List notification templates for the tenant. */
export function useNotificationTemplates(params?: ListTemplatesParams) {
  const slug = useOrgSlug();
  return useQuery<{ templates: NotificationTemplate[]; total: number }>({
    queryKey: notificationKeys.templates(slug, params),
    queryFn: () => listTemplates(slug, params),
    enabled: !!slug,
    staleTime: 30_000,
  });
}

/** Get a single template by ID. */
export function useNotificationTemplate(id: string | null) {
  const slug = useOrgSlug();
  return useQuery<NotificationTemplate>({
    queryKey: notificationKeys.template(slug, id ?? ""),
    queryFn: () => getTemplate(slug, id!),
    enabled: !!slug && !!id,
  });
}

/** List recent notification events (read-only log). */
export function useNotificationEvents(params?: ListEventsParams) {
  const slug = useOrgSlug();
  return useQuery<{ events: NotificationEvent[]; total: number }>({
    queryKey: notificationKeys.events(slug, params),
    queryFn: () => listEvents(slug, params),
    enabled: !!slug,
    staleTime: 15_000,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────

/** Create a template, invalidating the template list on success. */
export function useCreateTemplate() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTemplateRequest) => createTemplate(slug, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...notificationKeys.all, "templates", slug] });
    },
  });
}

/** Update a template, invalidating the list + single-template cache on success. */
export function useUpdateTemplate() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateTemplateRequest }) =>
      updateTemplate(slug, id, body),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: [...notificationKeys.all, "templates", slug] });
      queryClient.invalidateQueries({ queryKey: notificationKeys.template(slug, id) });
    },
  });
}

/** Delete a template, invalidating the template list on success. */
export function useDeleteTemplate() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTemplate(slug, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...notificationKeys.all, "templates", slug] });
    },
  });
}
