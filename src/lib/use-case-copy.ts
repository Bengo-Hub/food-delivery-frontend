/**
 * Use-Case Copy Factory
 *
 * Maps tenant use_case to industry-appropriate UI terminology.
 * All customer-facing strings that vary by industry come from this factory.
 * Backend tenant.use_case values: hospitality, retail, quick_service, services,
 * pharmacy, manufacturing, e_commerce, warehousing, other.
 */

export type UseCaseKey =
  | "hospitality"
  | "retail"
  | "quick_service"
  | "services"
  | "pharmacy"
  | "manufacturing"
  | "e_commerce"
  | "warehousing"
  | "other";

export interface UseCaseCopy {
  heroTitle: string;
  heroSubtitle: string;
  searchPlaceholder: string;
  categoryLabel: string;
  outletLabel: string;
  outletLabelPlural: string;
  itemLabel: string;
  itemLabelPlural: string;
  addOutletCTA: string;
  staffWorkflowLabel: string;
  pickupMessage: string;
  brandSuffix: string;
  processingLabel: string;
  deliverToLabel: string;
  dialogDescription: string;
}

const COPY_MAP: Record<UseCaseKey, UseCaseCopy> = {
  hospitality: {
    heroTitle: "Order food to your door",
    heroSubtitle: "Discover restaurants and cafes near you",
    searchPlaceholder: "Search for restaurants, dishes, or cuisines",
    categoryLabel: "Cuisine",
    outletLabel: "Restaurant",
    outletLabelPlural: "Restaurants",
    itemLabel: "Dish",
    itemLabelPlural: "Dishes",
    addOutletCTA: "Add your restaurant",
    staffWorkflowLabel: "Kitchen workflow",
    pickupMessage: "collect it yourself from the restaurant",
    brandSuffix: "Food Delivery",
    processingLabel: "Kitchen",
    deliverToLabel: "Deliver to",
    dialogDescription: "We'll find the best restaurants and delivery options for you",
  },
  retail: {
    heroTitle: "Shop & get it delivered",
    heroSubtitle: "Browse stores and shops near you",
    searchPlaceholder: "Search for products, stores, or brands",
    categoryLabel: "Category",
    outletLabel: "Store",
    outletLabelPlural: "Stores",
    itemLabel: "Product",
    itemLabelPlural: "Products",
    addOutletCTA: "Add your store",
    staffWorkflowLabel: "Order processing",
    pickupMessage: "collect it yourself from the store",
    brandSuffix: "Online Shopping",
    processingLabel: "Packing",
    deliverToLabel: "Deliver to",
    dialogDescription: "We'll find the best stores and delivery options for you",
  },
  quick_service: {
    heroTitle: "Quick bites, delivered fast",
    heroSubtitle: "Discover fast food and quick-service outlets near you",
    searchPlaceholder: "Search for quick bites, combos, or meals",
    categoryLabel: "Cuisine",
    outletLabel: "Outlet",
    outletLabelPlural: "Outlets",
    itemLabel: "Item",
    itemLabelPlural: "Items",
    addOutletCTA: "Add your outlet",
    staffWorkflowLabel: "Order preparation",
    pickupMessage: "collect it yourself from the outlet",
    brandSuffix: "Quick Service",
    processingLabel: "Prep Counter",
    deliverToLabel: "Deliver to",
    dialogDescription: "We'll find the best quick-service options for you",
  },
  services: {
    heroTitle: "Book services near you",
    heroSubtitle: "Find salons, spas, and service providers",
    searchPlaceholder: "Search for services or providers",
    categoryLabel: "Service Type",
    outletLabel: "Provider",
    outletLabelPlural: "Providers",
    itemLabel: "Service",
    itemLabelPlural: "Services",
    addOutletCTA: "Add your business",
    staffWorkflowLabel: "Service schedule",
    pickupMessage: "visit the service provider",
    brandSuffix: "Services",
    processingLabel: "Service",
    deliverToLabel: "Visit at",
    dialogDescription: "We'll find the best service providers near you",
  },
  pharmacy: {
    heroTitle: "Order medicines & health products",
    heroSubtitle: "Find pharmacies near you",
    searchPlaceholder: "Search for medicines or health products",
    categoryLabel: "Category",
    outletLabel: "Pharmacy",
    outletLabelPlural: "Pharmacies",
    itemLabel: "Product",
    itemLabelPlural: "Products",
    addOutletCTA: "Add your pharmacy",
    staffWorkflowLabel: "Dispensing workflow",
    pickupMessage: "collect it yourself from the pharmacy",
    brandSuffix: "Pharmacy",
    processingLabel: "Dispensing",
    deliverToLabel: "Deliver to",
    dialogDescription: "We'll find the nearest pharmacies for you",
  },
  manufacturing: {
    heroTitle: "Order supplies & materials",
    heroSubtitle: "Browse manufacturers and suppliers",
    searchPlaceholder: "Search for materials, supplies, or manufacturers",
    categoryLabel: "Category",
    outletLabel: "Supplier",
    outletLabelPlural: "Suppliers",
    itemLabel: "Product",
    itemLabelPlural: "Products",
    addOutletCTA: "Add your business",
    staffWorkflowLabel: "Production workflow",
    pickupMessage: "collect it yourself from the supplier",
    brandSuffix: "Supplies",
    processingLabel: "Production",
    deliverToLabel: "Deliver to",
    dialogDescription: "We'll find the best suppliers for you",
  },
  e_commerce: {
    heroTitle: "Shop from your favorite stores",
    heroSubtitle: "Discover online stores and marketplaces",
    searchPlaceholder: "Search for products, stores, or categories",
    categoryLabel: "Category",
    outletLabel: "Store",
    outletLabelPlural: "Stores",
    itemLabel: "Product",
    itemLabelPlural: "Products",
    addOutletCTA: "Add your store",
    staffWorkflowLabel: "Order fulfillment",
    pickupMessage: "collect it yourself from the store",
    brandSuffix: "Marketplace",
    processingLabel: "Fulfillment",
    deliverToLabel: "Ship to",
    dialogDescription: "We'll find the best stores and delivery options for you",
  },
  warehousing: {
    heroTitle: "Order from warehouses",
    heroSubtitle: "Browse wholesale and distribution centers",
    searchPlaceholder: "Search for bulk products or distributors",
    categoryLabel: "Category",
    outletLabel: "Warehouse",
    outletLabelPlural: "Warehouses",
    itemLabel: "Product",
    itemLabelPlural: "Products",
    addOutletCTA: "Add your warehouse",
    staffWorkflowLabel: "Picking & packing",
    pickupMessage: "collect it yourself from the warehouse",
    brandSuffix: "Wholesale",
    processingLabel: "Picking",
    deliverToLabel: "Ship to",
    dialogDescription: "We'll find the best wholesale options for you",
  },
  other: {
    heroTitle: "Order what you need",
    heroSubtitle: "Discover businesses near you",
    searchPlaceholder: "Search for products or services",
    categoryLabel: "Category",
    outletLabel: "Business",
    outletLabelPlural: "Businesses",
    itemLabel: "Item",
    itemLabelPlural: "Items",
    addOutletCTA: "Add your business",
    staffWorkflowLabel: "Order processing",
    pickupMessage: "collect it yourself from the business",
    brandSuffix: "Marketplace",
    processingLabel: "Processing",
    deliverToLabel: "Deliver to",
    dialogDescription: "We'll find the best options for you",
  },
};

/**
 * Get the copy strings for a given use case.
 * Falls back to "other" for unknown use cases.
 */
export function getUseCaseCopy(useCase: string | undefined | null): UseCaseCopy {
  const key = (useCase ?? "other") as UseCaseKey;
  return COPY_MAP[key] ?? COPY_MAP.other;
}

/**
 * Get a single copy string by key.
 */
export function getCopy(useCase: string | undefined | null, key: keyof UseCaseCopy): string {
  return getUseCaseCopy(useCase)[key];
}
