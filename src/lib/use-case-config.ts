/**
 * Use-Case Behavioural Config
 *
 * Companion to use-case-copy.ts (which maps use_case → terminology). This module
 * maps use_case → BEHAVIOUR: how the storefront catalog/cart/checkout should look
 * and act for each outlet vertical. It mirrors the pos-ui pattern
 * (`terminalConfigFor` in pos-ui/src/lib/use-case-config.ts) so the online store
 * is as flexible per vertical as the POS terminal — a hardware/electronics shop,
 * a restaurant, a pharmacy and a ticketed event should not all render the same
 * food-oriented menu.
 *
 * Keep this purely declarative — no React, no data fetching — so it can be unit
 * tested and reused from server components.
 */

export type OrderingProfile =
  | 'hospitality' // full-service restaurant / cafe / bar — menu + dietary + modifiers
  | 'quick_service' // QSR — menu, faster, fewer dietary nuances
  | 'pharmacy' // medicines / health — search-first, no dietary, age/Rx aware
  | 'retail' // general merchandise / hardware / electronics — products w/ make·model·specs
  | 'services' // salon / spa / wellness — bookable services, appointment-based
  | 'ticketing' // events — tickets, not add-to-cart-style goods
  | 'wholesale' // warehousing / distribution — bulk products
  | 'general'; // fallback

/**
 * Collapse any raw tenant/outlet use_case string into a canonical profile.
 * Accepts both the auth-api tenant values (hospitality, retail, quick_service,
 * services, pharmacy, manufacturing, e_commerce, warehousing, other) and the
 * inventory/pos outlet values (… warehouse). Unknown → 'general'.
 */
export function normalizeOrderingUseCase(useCase?: string | null): OrderingProfile {
  const u = (useCase ?? '').toLowerCase().trim();
  switch (u) {
    case 'hospitality':
    case 'restaurant':
    case 'cafe':
    case 'bar':
    case 'food':
    case 'food_delivery':
      return 'hospitality';
    case 'quick_service':
    case 'qsr':
    case 'fast_food':
      return 'quick_service';
    case 'pharmacy':
    case 'chemist':
      return 'pharmacy';
    case 'retail':
    case 'e_commerce':
    case 'ecommerce':
    case 'electronics':
    case 'hardware':
      return 'retail';
    case 'services':
    case 'salon':
    case 'spa':
    case 'wellness':
    case 'beauty':
      return 'services';
    case 'ticketing':
    case 'events':
    case 'event':
      return 'ticketing';
    case 'warehousing':
    case 'warehouse':
    case 'wholesale':
    case 'manufacturing':
      return 'wholesale';
    default:
      return 'general';
  }
}

export interface OrderingConfig {
  profile: OrderingProfile;
  /** Catalog grid density / style. Retail/wholesale favour denser product grids. */
  productLayout: 'comfortable' | 'compact';
  /** Primary call-to-action label on a catalog card. */
  ctaLabel: string;
  /** CTA label when the item has variants (selection required on the detail page). */
  selectOptionsLabel: string;
  /** Show vegan/gluten-free/etc. dietary filters (food verticals only). */
  showDietaryFilters: boolean;
  /** Surface make · model under the product name (retail/electronics/wholesale). */
  showMakeModel: boolean;
  /** Booking-style flow rather than add-to-cart (services → appointment, events → ticket). */
  bookingMode: 'none' | 'appointment' | 'ticket';
  /** Placeholder glyph for items without an image. */
  placeholderGlyph: string;
}

const BASE: OrderingConfig = {
  profile: 'general',
  productLayout: 'comfortable',
  ctaLabel: 'Add to Cart',
  selectOptionsLabel: 'Select Options',
  showDietaryFilters: false,
  showMakeModel: false,
  bookingMode: 'none',
  placeholderGlyph: '🛍️',
};

const CONFIG: Record<OrderingProfile, OrderingConfig> = {
  hospitality: {
    ...BASE,
    profile: 'hospitality',
    ctaLabel: 'Add to Order',
    showDietaryFilters: true,
    placeholderGlyph: '🍽️',
  },
  quick_service: {
    ...BASE,
    profile: 'quick_service',
    ctaLabel: 'Add to Order',
    showDietaryFilters: true,
    placeholderGlyph: '🍔',
  },
  pharmacy: {
    ...BASE,
    profile: 'pharmacy',
    ctaLabel: 'Add to Cart',
    showMakeModel: true, // brand / formulation
    placeholderGlyph: '💊',
  },
  retail: {
    ...BASE,
    profile: 'retail',
    productLayout: 'compact',
    ctaLabel: 'Add to Cart',
    showMakeModel: true,
    placeholderGlyph: '📦',
  },
  services: {
    ...BASE,
    profile: 'services',
    ctaLabel: 'Book Now',
    selectOptionsLabel: 'Choose a Time',
    bookingMode: 'appointment',
    placeholderGlyph: '🗓️',
  },
  ticketing: {
    ...BASE,
    profile: 'ticketing',
    ctaLabel: 'Get Tickets',
    selectOptionsLabel: 'Select Tickets',
    bookingMode: 'ticket',
    placeholderGlyph: '🎟️',
  },
  wholesale: {
    ...BASE,
    profile: 'wholesale',
    productLayout: 'compact',
    ctaLabel: 'Add to Order',
    showMakeModel: true,
    placeholderGlyph: '🏭',
  },
  general: BASE,
};

/** Resolve the behavioural config for a raw use_case value. */
export function orderingConfigFor(useCase?: string | null): OrderingConfig {
  return CONFIG[normalizeOrderingUseCase(useCase)];
}
