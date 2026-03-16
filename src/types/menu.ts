/**
 * Menu and Catalog Types
 * These types represent the data structures for menu items, categories, and outlets
 * In production, these should match the backend API response schemas
 */

export type DietaryTag = "vegan" | "vegetarian" | "glutenFree" | "spicy" | "chefSpecial" | "halal";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  categoryId: string;
  dietary: DietaryTag[];
  image?: string;
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
  isFavorite?: boolean;
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
  image?: string;
  sortOrder: number;
  itemCount: number;
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
  image?: string;
  isOpen: boolean;
  openingHours?: OutletHours[];
  promoted?: boolean;
  offerBadge?: string;
  discount?: number;
  businessType: "food" | "grocery" | "pharmacy" | "retail";
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
}
