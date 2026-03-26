/**
 * Catalog API Client
 * Functions for fetching catalog items, categories, and outlets from the backend
 */

import { getMediaUrl } from "@/lib/utils";
import type {
  MenuCategory,
  MenuFilters,
  MenuItem,
  Outlet,
  OutletFilters,
  PaginatedResponse
} from "@/types/catalog";
import { api } from "./base";

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

/** Backend public catalog item shape (basePrice, imageUrl, categoryId, categoryName). */
interface BackendMenuItem {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  currency: string;
  categoryId: string;
  categoryName?: string;
  imageUrl?: string;
  imageUrls?: string[];
  leadTimeMinutes?: number;
  variants?: unknown[];
  dietaryTags?: unknown[];
  isFavorite?: boolean;
  modifierGroups?: {
    id: string;
    name: string;
    is_required?: boolean;
    min_selections?: number;
    max_selections?: number;
    options?: {
      id: string;
      name: string;
      price_adjustment?: number;
      is_default?: boolean;
    }[];
  }[];
}

function backendItemToMenuItem(
  b: BackendMenuItem,
  outletId = "",
  outletName = "",
): MenuItem {
  const images = (b.imageUrls ?? [])
    .map((url) => getMediaUrl(url))
    .filter((url): url is string => !!url);
  return {
    id: b.id,
    name: b.name,
    description: b.description ?? "",
    price: b.basePrice,
    currency: b.currency,
    category: b.categoryName ?? "",
    categoryId: b.categoryId,
    image: getMediaUrl(b.imageUrl),
    ...(images.length > 0 ? { images } : {}),
    outletId,
    outletName,
    available: true,
    dietary: [],
    isFavorite: !!b.isFavorite,
    ...(b.modifierGroups ? { modifierGroups: b.modifierGroups.map((g) => ({
      id: g.id,
      name: g.name,
      isRequired: g.is_required ?? false,
      minSelections: g.min_selections ?? 0,
      maxSelections: g.max_selections ?? 1,
      options: (g.options ?? []).map((o) => ({
        id: o.id,
        name: o.name,
        priceAdjustment: o.price_adjustment ?? 0,
        isDefault: o.is_default ?? false,
      })),
    })) } : {}),
  };
}

// =============================================================================
// CATALOG ITEMS API (tenant-scoped: path = {tenantSlug}/catalog/...)
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
  if (filters?.outletId) params.set("outlet_id", filters.outletId);
  if (filters?.favoriteOnly) params.set("favorite", "true");

  const res = await api.get<BackendListResponse<BackendMenuItem>>(
    `${tenantSlug}/catalog/items?${params.toString()}`,
  );
  const outletId = filters?.outletId ?? "";
  const outletName = "";
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
  const response = await api.get<BackendMenuItem>(`${tenantSlug}/catalog/items/${id}`);
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

/** Backend catalog category shape (imageUrl). */
interface BackendMenuCategory {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  icon?: string;
  itemCount: number;
}

export async function fetchCategories(
  tenantSlug: string,
  outletId?: string,
): Promise<MenuCategory[]> {
  const params = outletId ? `?outlet_id=${outletId}` : "";
  const response = await api.get<BackendMenuCategory[]>(`${tenantSlug}/catalog/categories${params}`);
  return response.data.map((cat) => ({
    id: cat.id,
    name: cat.name,
    description: cat.description ?? "",
    image: cat.imageUrl ? getMediaUrl(cat.imageUrl) : cat.icon ? getMediaUrl(cat.icon) : "",
    sortOrder: 0,
    itemCount: cat.itemCount,
  }));
}

export async function fetchCategory(tenantSlug: string, id: string): Promise<MenuCategory> {
  const response = await api.get<BackendMenuCategory>(`${tenantSlug}/catalog/categories/${id}`);
  const cat = response.data;
  return {
    id: cat.id,
    name: cat.name,
    description: cat.description ?? "",
    image: cat.imageUrl ? getMediaUrl(cat.imageUrl) : cat.icon ? getMediaUrl(cat.icon) : "",
    sortOrder: 0,
    itemCount: cat.itemCount,
  };
}

// =============================================================================
// OUTLETS API (GET /outlets returns list for tenant)
// =============================================================================

/** Backend outlet response — now returns full outlet data. */
interface BackendOutlet {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  openingHours?: Record<string, unknown>;
  imageUrl?: string;
  status?: string;
  useCase?: string;
}

function backendOutletToOutlet(o: BackendOutlet): Outlet {
  return {
    id: o.id,
    name: o.name,
    description: o.description ?? "",
    address: o.address ?? "",
    latitude: o.latitude ?? 0,
    longitude: o.longitude ?? 0,
    phone: o.phone ?? "",
    email: o.email ?? "",
    image: getMediaUrl(o.imageUrl),
    isOpen: o.status === "active",
    businessType: (o.useCase as Outlet["businessType"]) ?? "food",
    // These fields may be populated by future enhancements
    rating: 0,
    reviewCount: 0,
    deliveryTime: "",
    deliveryFee: "",
    cuisines: [],
  };
}

export async function fetchOutlets(
  tenantSlug: string,
  filters?: OutletFilters,
  page = 1,
  limit = 20,
): Promise<PaginatedResponse<Outlet>> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));

  // Pass all supported filter params to the backend
  if (filters?.search) params.set("q", filters.search);
  if (filters?.minRating != null) params.set("min_rating", String(filters.minRating));
  if (filters?.maxDeliveryFee != null) params.set("max_delivery_fee", String(filters.maxDeliveryFee));
  if (filters?.maxDeliveryTime != null) params.set("max_delivery_time", String(filters.maxDeliveryTime));
  if (filters?.sort) params.set("sort", filters.sort);
  if (filters?.offers) params.set("offers", "true");
  if (filters?.pickup) params.set("pickup", "true");
  if (filters?.scheduled) params.set("scheduled", "true");
  if (filters?.category) params.set("category", filters.category);
  if (filters?.cuisines?.length) params.set("cuisines", filters.cuisines.join(","));
  if (filters?.isOpen != null) params.set("is_open", String(filters.isOpen));
  if (filters?.businessType) params.set("business_type", filters.businessType);
  if (filters?.lat != null) params.set("lat", String(filters.lat));
  if (filters?.lng != null) params.set("lng", String(filters.lng));
  if (filters?.maxDistance != null) params.set("max_distance", String(filters.maxDistance));

  const response = await api.get<BackendListResponse<BackendOutlet>>(
    `${tenantSlug}/outlets?${params.toString()}`,
  );
  const asOutlets: Outlet[] = (response.data.data ?? []).map(backendOutletToOutlet);
  return toPaginated({ ...response.data, data: asOutlets });
}

export async function fetchOutlet(tenantSlug: string, id: string): Promise<Outlet> {
  const response = await api.get<BackendOutlet>(`${tenantSlug}/outlets/${id}`);
  return backendOutletToOutlet(response.data);
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

export async function toggleFavorite(
  tenantSlug: string,
  itemId: string,
): Promise<{ isFavorite: boolean }> {
  const response = await api.post<{ isFavorite: boolean }>(
    `${tenantSlug}/catalog/items/${itemId}/favorite`,
    {},
  );
  return response.data;
}
