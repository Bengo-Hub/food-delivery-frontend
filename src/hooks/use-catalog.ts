/**
 * TanStack Query Hooks for Catalog
 * These hooks provide data fetching with caching, loading states, and error handling
 */

import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";

import {
  fetchCategories,
  fetchCategory,
  fetchFeaturedItems,
  fetchMenuItem,
  fetchMenuItems,
  fetchOutlet,
  fetchOutletMenu,
  fetchOutlets,
  toggleFavorite,
} from "@/lib/api/catalog";
import type { MenuFilters, OutletFilters } from "@/types/catalog";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// =============================================================================
// QUERY KEYS
// =============================================================================

export const catalogKeys = {
  all: ["catalog"] as const,
  items: () => [...catalogKeys.all, "items"] as const,
  itemList: (filters?: MenuFilters) => [...catalogKeys.items(), filters] as const,
  item: (id: string) => [...catalogKeys.items(), id] as const,
  featured: (outletId?: string) => [...catalogKeys.items(), "featured", outletId] as const,
  categories: () => [...catalogKeys.all, "categories"] as const,
  categoryList: (outletId?: string) => [...catalogKeys.categories(), outletId] as const,
  category: (id: string) => [...catalogKeys.categories(), id] as const,
};

export const outletKeys = {
  all: ["outlets"] as const,
  list: (filters?: OutletFilters) => [...outletKeys.all, "list", filters] as const,
  detail: (id: string) => [...outletKeys.all, id] as const,
  menu: (outletId: string, filters?: MenuFilters) =>
    [...outletKeys.all, outletId, "menu", filters] as const,
};

// Catalog cache TTL: 5 min (plan §3)
const CATALOG_STALE_MS = 5 * 60 * 1000;
const CATALOG_GC_MS = CATALOG_STALE_MS * 2;

// =============================================================================
// MENU ITEMS HOOKS
// =============================================================================

/**
 * Hook to fetch paginated menu items with filters (requires tenant slug for API path).
 */
export function useCatalogItems(
  tenantSlug: string,
  filters?: MenuFilters,
  page = 1,
  limit = 20,
) {
  return useQuery({
    queryKey: [tenantSlug, ...catalogKeys.itemList(filters), page, limit],
    queryFn: () => fetchMenuItems(tenantSlug, filters, page, limit),
    enabled: !!tenantSlug,
    placeholderData: keepPreviousData,
    staleTime: CATALOG_STALE_MS,
    gcTime: CATALOG_GC_MS,
  });
}

/**
 * Hook to fetch menu items with infinite scroll
 */
export function useInfiniteCatalogItems(
  tenantSlug: string,
  filters?: MenuFilters,
  limit = 20,
) {
  return useInfiniteQuery({
    queryKey: [tenantSlug, ...catalogKeys.itemList(filters), "infinite"],
    queryFn: ({ pageParam = 1 }) => fetchMenuItems(tenantSlug, filters, pageParam, limit),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled: !!tenantSlug,
    staleTime: CATALOG_STALE_MS,
    gcTime: CATALOG_GC_MS,
  });
}

/**
 * Hook to fetch a single menu item by ID
 */
export function useCatalogItem(tenantSlug: string, id: string) {
  return useQuery({
    queryKey: [tenantSlug, ...catalogKeys.item(id)],
    queryFn: () => fetchMenuItem(tenantSlug, id),
    enabled: !!tenantSlug && !!id,
    staleTime: CATALOG_STALE_MS,
    gcTime: CATALOG_GC_MS,
  });
}

/**
 * Hook to fetch featured menu items
 */
export function useFeaturedItems(
  tenantSlug: string,
  outletId?: string,
  limit = 10,
) {
  return useQuery({
    queryKey: [tenantSlug, ...catalogKeys.featured(outletId)],
    queryFn: () => fetchFeaturedItems(tenantSlug, outletId, limit),
    enabled: !!tenantSlug,
    staleTime: CATALOG_STALE_MS,
    gcTime: CATALOG_GC_MS,
  });
}

// =============================================================================
// CATEGORIES HOOKS
// =============================================================================

/**
 * Hook to fetch all catalog categories (outletId optional for filtering by outlet).
 */
export function useCategories(tenantSlug: string, outletId?: string, useCase?: string) {
  return useQuery({
    queryKey: [tenantSlug, ...catalogKeys.categoryList(outletId), useCase ?? ""],
    queryFn: () => fetchCategories(tenantSlug, outletId, useCase),
    enabled: !!tenantSlug,
    staleTime: CATALOG_STALE_MS,
    gcTime: CATALOG_GC_MS,
  });
}

/**
 * Hook to fetch a single category by ID
 */
export function useCategory(tenantSlug: string, id: string) {
  return useQuery({
    queryKey: [tenantSlug, ...catalogKeys.category(id)],
    queryFn: () => fetchCategory(tenantSlug, id),
    enabled: !!tenantSlug && !!id,
    staleTime: CATALOG_STALE_MS,
    gcTime: CATALOG_GC_MS,
  });
}

// =============================================================================
// OUTLETS HOOKS
// =============================================================================

/**
 * Hook to fetch paginated outlets for tenant
 */
export function useOutlets(
  tenantSlug: string,
  filters?: OutletFilters,
  page = 1,
  limit = 20,
) {
  return useQuery({
    queryKey: [tenantSlug, ...outletKeys.list(filters), page, limit],
    queryFn: () => fetchOutlets(tenantSlug, filters, page, limit),
    enabled: !!tenantSlug,
    placeholderData: keepPreviousData,
    staleTime: CATALOG_STALE_MS,
    gcTime: CATALOG_GC_MS,
  });
}

/**
 * Hook to fetch outlets with infinite scroll
 */
export function useInfiniteOutlets(
  tenantSlug: string,
  filters?: OutletFilters,
  limit = 20,
) {
  return useInfiniteQuery({
    queryKey: [tenantSlug, ...outletKeys.list(filters), "infinite"],
    queryFn: ({ pageParam = 1 }) => fetchOutlets(tenantSlug, filters, pageParam, limit),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled: !!tenantSlug,
  });
}

/**
 * Hook to fetch a single outlet by ID
 */
export function useOutlet(tenantSlug: string, id: string) {
  return useQuery({
    queryKey: [tenantSlug, ...outletKeys.detail(id)],
    queryFn: () => fetchOutlet(tenantSlug, id),
    enabled: !!tenantSlug && !!id,
    staleTime: CATALOG_STALE_MS,
    gcTime: CATALOG_GC_MS,
  });
}

/**
 * Hook to fetch menu items for a specific outlet
 */
export function useOutletMenu(
  tenantSlug: string,
  outletId: string,
  filters?: MenuFilters,
  page = 1,
  limit = 50,
) {
  return useQuery({
    queryKey: [tenantSlug, ...outletKeys.menu(outletId, filters), page, limit],
    queryFn: () => fetchOutletMenu(tenantSlug, outletId, filters, page, limit),
    enabled: !!tenantSlug && !!outletId,
    placeholderData: keepPreviousData,
    staleTime: CATALOG_STALE_MS,
    gcTime: CATALOG_GC_MS,
  });
}

/**
 * Hook to fetch outlet menu with infinite scroll
 */
export function useInfiniteOutletMenu(
  tenantSlug: string,
  outletId: string,
  filters?: MenuFilters,
  limit = 20,
) {
  return useInfiniteQuery({
    queryKey: [tenantSlug, ...outletKeys.menu(outletId, filters), "infinite"],
    queryFn: ({ pageParam = 1 }) =>
      fetchOutletMenu(tenantSlug, outletId, filters, pageParam, limit),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled: !!tenantSlug && !!outletId,
    staleTime: CATALOG_STALE_MS,
    gcTime: CATALOG_GC_MS,
  });
}

/**
 * Hook to toggle favorite status
 */
export function useToggleFavorite(tenantSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => toggleFavorite(tenantSlug, itemId),
    onSuccess: (_: { isFavorite: boolean }, itemId: string) => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: [tenantSlug, ...catalogKeys.all] });
    },
  });
}
