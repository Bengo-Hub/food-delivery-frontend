/**
 * TanStack Query Hooks for Menu/Catalog
 * These hooks provide data fetching with caching, loading states, and error handling
 */

import { useQuery, useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";

import {
  fetchMenuItems,
  fetchMenuItem,
  fetchFeaturedItems,
  fetchCategories,
  fetchCategory,
  fetchOutlets,
  fetchOutlet,
  fetchOutletMenu,
} from "@/lib/api/menu";
import type { MenuFilters, OutletFilters } from "@/types/menu";

// =============================================================================
// QUERY KEYS
// =============================================================================

export const menuKeys = {
  all: ["menu"] as const,
  items: () => [...menuKeys.all, "items"] as const,
  itemList: (filters?: MenuFilters) => [...menuKeys.items(), filters] as const,
  item: (id: string) => [...menuKeys.items(), id] as const,
  featured: (outletId?: string) => [...menuKeys.items(), "featured", outletId] as const,
  categories: () => [...menuKeys.all, "categories"] as const,
  categoryList: (outletId?: string) => [...menuKeys.categories(), outletId] as const,
  category: (id: string) => [...menuKeys.categories(), id] as const,
};

export const outletKeys = {
  all: ["outlets"] as const,
  list: (filters?: OutletFilters) => [...outletKeys.all, "list", filters] as const,
  detail: (id: string) => [...outletKeys.all, id] as const,
  menu: (outletId: string, filters?: MenuFilters) =>
    [...outletKeys.all, outletId, "menu", filters] as const,
};

// =============================================================================
// MENU ITEMS HOOKS
// =============================================================================

/**
 * Hook to fetch paginated menu items with filters (requires tenant slug for API path).
 */
export function useMenuItems(
  tenantSlug: string,
  filters?: MenuFilters,
  page = 1,
  limit = 20,
) {
  return useQuery({
    queryKey: [tenantSlug, ...menuKeys.itemList(filters), page, limit],
    queryFn: () => fetchMenuItems(tenantSlug, filters, page, limit),
    enabled: !!tenantSlug,
    placeholderData: keepPreviousData,
  });
}

/**
 * Hook to fetch menu items with infinite scroll
 */
export function useInfiniteMenuItems(
  tenantSlug: string,
  filters?: MenuFilters,
  limit = 20,
) {
  return useInfiniteQuery({
    queryKey: [tenantSlug, ...menuKeys.itemList(filters), "infinite"],
    queryFn: ({ pageParam = 1 }) => fetchMenuItems(tenantSlug, filters, pageParam, limit),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled: !!tenantSlug,
  });
}

/**
 * Hook to fetch a single menu item by ID
 */
export function useMenuItem(tenantSlug: string, id: string) {
  return useQuery({
    queryKey: [tenantSlug, ...menuKeys.item(id)],
    queryFn: () => fetchMenuItem(tenantSlug, id),
    enabled: !!tenantSlug && !!id,
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
    queryKey: [tenantSlug, ...menuKeys.featured(outletId)],
    queryFn: () => fetchFeaturedItems(tenantSlug, outletId, limit),
    enabled: !!tenantSlug,
  });
}

// =============================================================================
// CATEGORIES HOOKS
// =============================================================================

/**
 * Hook to fetch all menu categories (cafeId required by backend for public list).
 */
export function useCategories(tenantSlug: string, cafeId?: string) {
  return useQuery({
    queryKey: [tenantSlug, ...menuKeys.categoryList(cafeId)],
    queryFn: () => fetchCategories(tenantSlug, cafeId),
    enabled: !!tenantSlug,
  });
}

/**
 * Hook to fetch a single category by ID
 */
export function useCategory(tenantSlug: string, id: string) {
  return useQuery({
    queryKey: [tenantSlug, ...menuKeys.category(id)],
    queryFn: () => fetchCategory(tenantSlug, id),
    enabled: !!tenantSlug && !!id,
  });
}

// =============================================================================
// OUTLETS / CAFES HOOKS
// =============================================================================

/**
 * Hook to fetch paginated cafes/outlets for tenant
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
 * Hook to fetch a single outlet/cafe by ID
 */
export function useOutlet(tenantSlug: string, id: string) {
  return useQuery({
    queryKey: [tenantSlug, ...outletKeys.detail(id)],
    queryFn: () => fetchOutlet(tenantSlug, id),
    enabled: !!tenantSlug && !!id,
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
  });
}
