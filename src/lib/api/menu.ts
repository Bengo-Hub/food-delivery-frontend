/**
 * Menu API Client
 * Functions for fetching menu items, categories, and outlets from the backend
 */

import { api } from "./base";
import type {
  MenuItem,
  MenuCategory,
  MenuFilters,
  Outlet,
  OutletFilters,
  PaginatedResponse,
} from "@/types/menu";

/** Backend list response (data, total, limit, page). */
interface BackendListResponse<T> {
  data: T[];
  total: number;
  limit: number;
  page: number;
}

function toPaginated<T>(r: BackendListResponse<T>): PaginatedResponse<T> {
  const totalPages = r.limit > 0 ? Math.ceil(r.total / r.limit) : 0;
  return {
    data: r.data,
    meta: { page: r.page, limit: r.limit, total: r.total, totalPages },
  };
}

/** Backend public menu item shape (basePrice, imageUrl, categoryId, categoryName). */
interface BackendMenuItem {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  currency: string;
  categoryId: string;
  categoryName?: string;
  imageUrl?: string;
  leadTimeMinutes?: number;
  variants?: unknown[];
  dietaryTags?: unknown[];
}

function backendItemToMenuItem(
  b: BackendMenuItem,
  outletId = "",
  outletName = "",
): MenuItem {
  return {
    id: b.id,
    name: b.name,
    description: b.description ?? "",
    price: b.basePrice,
    currency: b.currency,
    category: b.categoryName ?? "",
    categoryId: b.categoryId,
    ...(b.imageUrl != null && b.imageUrl !== "" && { image: b.imageUrl }),
    outletId,
    outletName,
    available: true,
    dietary: [],
  };
}

// =============================================================================
// MENU ITEMS API (tenant-scoped: path = {tenantSlug}/menu/...)
// =============================================================================

export async function fetchMenuItems(
  tenantSlug: string,
  filters?: MenuFilters,
  page = 1,
  limit = 20,
): Promise<PaginatedResponse<MenuItem>> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (filters?.category) params.set("category_id", filters.category);
  if (filters?.search) params.set("search", filters.search ?? "");
  if (filters?.dietary?.length) params.set("dietary", filters.dietary.join(","));
  if (filters?.minPrice !== undefined) params.set("minPrice", String(filters.minPrice));
  if (filters?.maxPrice !== undefined) params.set("maxPrice", String(filters.maxPrice));
  if (filters?.featured !== undefined) params.set("featured", String(filters.featured));
  if (filters?.outletId) params.set("cafe_id", filters.outletId);

  const res = await api.get<BackendListResponse<BackendMenuItem>>(
    `${tenantSlug}/menu/items?${params.toString()}`,
  );
  const outletId = filters?.outletId ?? "";
  const outletName = ""; // Can be filled from cafes list when needed
  const data: MenuItem[] = res.data.data.map((b: BackendMenuItem) =>
    backendItemToMenuItem(b, outletId, outletName),
  );
  return toPaginated({ ...res.data, data });
}

export async function fetchMenuItem(
  tenantSlug: string,
  id: string,
  outletId = "",
  outletName = "",
): Promise<MenuItem> {
  const response = await api.get<BackendMenuItem>(`${tenantSlug}/menu/items/${id}`);
  return backendItemToMenuItem(response.data, outletId, outletName);
}

export async function fetchFeaturedItems(
  tenantSlug: string,
  outletId?: string,
  limit = 10,
): Promise<MenuItem[]> {
  const pag = await fetchMenuItems(
    tenantSlug,
    { featured: true, ...(outletId ? { outletId } : {}) },
    1,
    limit,
  );
  return pag.data;
}

// =============================================================================
// CATEGORIES API
// =============================================================================

export async function fetchCategories(
  tenantSlug: string,
  cafeId?: string,
): Promise<MenuCategory[]> {
  const params = cafeId ? `?cafe_id=${cafeId}` : "";
  const response = await api.get<MenuCategory[]>(`${tenantSlug}/menu/categories${params}`);
  return response.data;
}

export async function fetchCategory(tenantSlug: string, id: string): Promise<MenuCategory> {
  const response = await api.get<MenuCategory>(`${tenantSlug}/menu/categories/${id}`);
  return response.data;
}

// =============================================================================
// CAFES / OUTLETS API (GET /cafes returns list for tenant; backend returns id+name, we map to Outlet)
// =============================================================================

interface CafeSummaryResponse {
  id: string;
  name: string;
}

function cafeSummaryToOutlet(c: CafeSummaryResponse): Outlet {
  return {
    id: c.id,
    name: c.name,
    address: "",
    latitude: 0,
    longitude: 0,
    rating: 0,
    reviewCount: 0,
    deliveryTime: "25-35",
    deliveryFee: "Free",
    cuisines: [],
    isOpen: true,
    businessType: "food",
  };
}

export async function fetchOutlets(
  tenantSlug: string,
  _filters?: OutletFilters,
  page = 1,
  limit = 20,
): Promise<PaginatedResponse<Outlet>> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  const response = await api.get<BackendListResponse<CafeSummaryResponse>>(
    `${tenantSlug}/cafes?${params.toString()}`,
  );
  const asOutlets: Outlet[] = (response.data.data ?? []).map(cafeSummaryToOutlet);
  return toPaginated({ ...response.data, data: asOutlets });
}

export async function fetchOutlet(tenantSlug: string, id: string): Promise<Outlet> {
  const response = await api.get<CafeSummaryResponse>(`${tenantSlug}/cafes/${id}`);
  return cafeSummaryToOutlet(response.data);
}

export async function fetchOutletMenu(
  tenantSlug: string,
  outletId: string,
  filters?: MenuFilters,
  page = 1,
  limit = 50,
): Promise<PaginatedResponse<MenuItem>> {
  return fetchMenuItems(tenantSlug, { ...filters, outletId }, page, limit);
}
