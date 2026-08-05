/**
 * Menu and Catalog Types
 * These types represent the data structures for menu items, categories, and outlets
 * In production, these should match the backend API response schemas
 */

export type DietaryTag = "vegan" | "vegetarian" | "glutenFree" | "spicy" | "chefSpecial" | "halal";

export type ItemType = "GOODS" | "SERVICE" | "RECIPE" | "INGREDIENT" | "VOUCHER" | "EQUIPMENT";

export interface MenuItem {
  id: string;
  /** Raw inventory-api item UUID (distinct from `id`, which prefers the SKU when present).
   *  Needed to cross-reference pos-api promotion rule `scope_ids` (item-scoped deals), which
   *  reference inventory-api item IDs, not SKUs. */
  inventoryId?: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  categoryId: string;
  dietary: DietaryTag[];
  image?: string | undefined;
  images?: string[];
  outletId: string;
  outletName: string;
  available: boolean;
  featured?: boolean;
  discountPercent?: number;
  originalPrice?: number;
  preparationTime?: number; // in minutes
  calories?: number;
  allergens?: string[];
  customizations?: MenuItemCustomization[];
  modifierGroups?: ModifierGroup[];
  isFavorite?: boolean;
  /** Item type from inventory (GOODS, SERVICE, RECIPE, etc.) */
  itemType?: ItemType;
  /** Duration in minutes for SERVICE type items */
  durationMinutes?: number;
  /** Whether this item requires age verification (alcohol, pharmacy) */
  requiresAgeVerification?: boolean;
  /** Manufacturer name (retail/goods), shown as muted subtext when present. */
  manufacturer?: string;
  /** Model name/number (retail/goods), shown as muted subtext when present. */
  model?: string;
  /** Whether this item has selectable variants (e.g. color/size). */
  hasVariants?: boolean;
  /** Selectable variants. Present when the item is fetched with variants included. */
  variants?: CatalogVariant[];
}

/**
 * A selectable product variant (e.g. a specific color/size combination).
 * Each variant is purchased as its own cart line with its own price and SKU.
 */
export interface CatalogVariant {
  id: string;
  sku: string;
  name: string;
  price: number;
  /** Attribute map, e.g. { color: "Red", size: "M" }. */
  attributes: Record<string, string>;
  barcode?: string;
  isActive?: boolean;
}

export interface ModifierGroup {
  id: string;
  name: string;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  options: ModifierOption[];
}

export interface ModifierOption {
  id: string;
  name: string;
  priceAdjustment: number;
  isDefault: boolean;
}

export interface MenuItemCustomization {
  id: string;
  name: string;
  required: boolean;
  maxSelections: number;
  options: CustomizationOption[];
}

export interface CustomizationOption {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  image?: string | undefined;
  /** Emoji/glyph form of the category's icon — prefer this over `image` when set (see
   *  resolveCategoryIcon in lib/utils.ts for why `icon` isn't always an image path). */
  emoji?: string | undefined;
  sortOrder: number;
  itemCount: number;
  /** Parent category id. Null/undefined = top-level (either a group parent or a genuine
   *  standalone root category). Drives the "Shop by Category" sidebar tree for
   *  retail/pharmacy/wholesale tenants. */
  parentId?: string | null;
  /** Denormalized parent name, when this category is a child. */
  parentName?: string;
  /** Depth in the category tree (0 = top-level). */
  depth?: number;
  /** Materialized path (e.g. "Phones & Communication/Chargers"). */
  path?: string;
}

export interface Outlet {
  id: string;
  name: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  email?: string;
  rating: number;
  reviewCount: number;
  deliveryTime: string;
  deliveryFee: string;
  minimumOrder?: number;
  cuisines: string[];
  image?: string | undefined;
  isOpen: boolean;
  openingHours?: OutletHours[];
  promoted?: boolean;
  offerBadge?: string;
  discount?: number;
  /**
   * Per-outlet booking deposit percentage (0-100). When > 0, BOOKING carts
   * (event tickets / service appointments) pay only this % up front at checkout;
   * the remainder is settled at the event/appointment. 0 = pay the full amount.
   */
  bookingDepositPercent?: number;
  /** Absent when the outlet's use_case hasn't synced yet — callers should fall back to the tenant's own resolved use_case, never assume a vertical. */
  businessType?: "food" | "grocery" | "pharmacy" | "retail" | "services" | "hospitality" | "quick_service" | "manufacturing" | "e_commerce" | "warehousing" | string | undefined;
}

export interface OutletHours {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  openTime: string; // HH:mm format
  closeTime: string;
  isClosed: boolean;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MenuFilters {
  category?: string;
  dietary?: DietaryTag[];
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  outletId?: string;
  favoriteOnly?: boolean;
}

export interface OutletFilters {
  search?: string;
  cuisines?: string[];
  minRating?: number;
  maxDeliveryFee?: number;
  maxDeliveryTime?: number;
  isOpen?: boolean;
  businessType?: string;
  sort?: string;
  offers?: boolean;
  pickup?: boolean;
  scheduled?: boolean;
  category?: string;
  lat?: number;
  lng?: number;
  maxDistance?: number;
}
