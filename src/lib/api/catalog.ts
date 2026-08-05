/**
 * Catalog API Client
 * Functions for fetching catalog items, categories, and outlets from the backend
 */

import { getMediaUrl, resolveCategoryIcon } from "@/lib/utils";
import type {
  CatalogVariant,
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

/** Backend variant shape on a merged catalog item. */
interface BackendVariant {
  id: string;
  sku: string;
  name: string;
  price: number;
  attributes?: Record<string, string>;
  barcode?: string;
  isActive?: boolean;
}

/** Backend public catalog item shape (basePrice, imageUrl, categoryId, categoryName). */
interface BackendMenuItem {
  id?: string;
  sku: string;
  inventoryId?: string;
  name: string;
  description?: string;
  basePrice: number;
  currency: string;
  categoryId: string;
  categoryName?: string;
  imageUrl?: string;
  imageUrls?: string[];
  leadTimeMinutes?: number;
  manufacturer?: string;
  model?: string;
  hasVariants?: boolean;
  variants?: BackendVariant[];
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
  // Only surface active variants to the storefront.
  const variants: CatalogVariant[] = (b.variants ?? [])
    .filter((v) => v.isActive !== false)
    .map((v) => ({
      id: v.id,
      sku: v.sku,
      name: v.name,
      price: v.price,
      attributes: v.attributes ?? {},
      ...(v.barcode ? { barcode: v.barcode } : {}),
      isActive: v.isActive ?? true,
    }));
  const hasVariants = b.hasVariants ?? variants.length > 0;
  return {
    id: b.sku || b.id || b.inventoryId || "",
    ...(b.inventoryId ? { inventoryId: b.inventoryId } : {}),
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
    ...(b.manufacturer ? { manufacturer: b.manufacturer } : {}),
    ...(b.model ? { model: b.model } : {}),
    hasVariants,
    ...(variants.length > 0 ? { variants } : {}),
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
  // Include variants so cards know whether a product needs variant selection.
  params.set("include", "variants");
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
  const response = await api.get<BackendMenuItem>(
    `${tenantSlug}/catalog/items/${id}?include=variants`,
  );
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
  /** Parent→children tree fields (see ordering-backend catalog.InventoryCategory). */
  parentId?: string | null;
  parentName?: string;
  depth?: number;
  path?: string;
  sortOrder?: number;
}

export async function fetchCategories(
  tenantSlug: string,
  outletId?: string,
  useCase?: string,
): Promise<MenuCategory[]> {
  // use_case lets the backend drop categories that don't belong to this outlet's
  // vertical (e.g. food categories never appear on a hardware storefront).
  const qs = new URLSearchParams();
  if (outletId) qs.set("outlet_id", outletId);
  if (useCase) qs.set("use_case", useCase);
  const params = qs.toString() ? `?${qs.toString()}` : "";
  const response = await api.get<BackendMenuCategory[]>(`${tenantSlug}/catalog/categories${params}`);
  return response.data.map((cat) => {
    const { emoji, image } = resolveCategoryIcon(cat.icon, cat.imageUrl);
    return {
      id: cat.id,
      name: cat.name,
      description: cat.description ?? "",
      image: image ?? "",
      ...(emoji ? { emoji } : {}),
      sortOrder: cat.sortOrder ?? 0,
      itemCount: cat.itemCount,
      parentId: cat.parentId ?? null,
      ...(cat.parentName ? { parentName: cat.parentName } : {}),
      depth: cat.depth ?? 0,
      ...(cat.path ? { path: cat.path } : {}),
    };
  });
}

export async function fetchCategory(tenantSlug: string, id: string): Promise<MenuCategory> {
  const response = await api.get<BackendMenuCategory>(`${tenantSlug}/catalog/categories/${id}`);
  const cat = response.data;
  const { emoji, image } = resolveCategoryIcon(cat.icon, cat.imageUrl);
  return {
    id: cat.id,
    name: cat.name,
    description: cat.description ?? "",
    image: image ?? "",
    ...(emoji ? { emoji } : {}),
    sortOrder: cat.sortOrder ?? 0,
    itemCount: cat.itemCount,
    parentId: cat.parentId ?? null,
    ...(cat.parentName ? { parentName: cat.parentName } : {}),
    depth: cat.depth ?? 0,
    ...(cat.path ? { path: cat.path } : {}),
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
  isOpen?: boolean;
  is_open?: boolean;
  bookingDepositPercent?: number;
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
    isOpen: o.isOpen ?? o.is_open ?? o.status === "active",
    // No vertical fallback here — this module has no tenant context to guess
    // from. Defaulting to "food" previously forced every outlet with a
    // missing/unsynced use_case to render hospitality iconography (fork+knife)
    // regardless of its real business type. Callers with tenant context
    // (e.g. the homepage) should fall back to the tenant's own resolved
    // use_case instead of a hardcoded vertical.
    businessType: (o.useCase as Outlet["businessType"] | undefined) ?? undefined,
    // Per-outlet booking deposit % (drives the deposit-at-checkout breakdown for
    // ticket/appointment carts). Absent/undefined → treated as 0 (pay in full).
    ...(o.bookingDepositPercent != null ? { bookingDepositPercent: o.bookingDepositPercent } : {}),
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
