"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/base";
import { getMediaUrl } from "@/lib/utils";
import { useOrgSlug } from "@/providers/org-slug-provider";
import type { Category } from "@/components/category/category-carousel";

interface BackendCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image_url?: string;
  parent_id?: string;
  depth?: number;
  sort_order?: number;
  is_active?: boolean;
}

function mapCategory(c: BackendCategory): Category {
  const imageUrl = c.icon ? getMediaUrl(c.icon) : c.image_url ? getMediaUrl(c.image_url) : undefined;
  return {
    id: c.slug || c.id,
    name: c.name,
    ...(imageUrl != null ? { imageUrl } : {}),
  };
}

/**
 * Fetches categories from the ordering-backend catalog API.
 * Falls back to empty array on error — the component should use defaultCategories as fallback.
 */
async function fetchCategories(tenantSlug: string): Promise<Category[]> {
  try {
    const res = await api.get(`${tenantSlug}/catalog/categories`);
    const body = res.data;
    const items: BackendCategory[] = Array.isArray(body) ? body : (body?.data ?? []);
    return items.filter((c) => c.is_active !== false).map(mapCategory);
  } catch {
    return [];
  }
}

/**
 * Hook that fetches categories from the backend API.
 * Returns categories with icon URLs from inventory-api.
 */
export function useCategories() {
  const slug = useOrgSlug();
  return useQuery({
    queryKey: ["catalog-categories", slug],
    queryFn: () => fetchCategories(slug),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}
