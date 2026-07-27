import {
  CalendarClock,
  Package,
  Pill,
  Sandwich,
  ShoppingBag,
  Ticket,
  UtensilsCrossed,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

import { normalizeOrderingUseCase, type OrderingProfile } from "@/lib/use-case-config";
import { cn } from "@/lib/utils";

/**
 * Single source of truth for the SVG "no photo available" illustration per
 * business vertical — replaces the three previously-inconsistent mechanisms
 * (a hardcoded Urban Loft JPEG via getMediaUrl, an ad-hoc emoji switch in
 * OutletCard, and a single hardcoded 🍽️ in FeaturedItemCard/ItemImageGallery).
 * Real SVG vector icons (lucide-react), never emoji, per the platform's
 * icon-consistency design rule.
 */
const ICON_BY_PROFILE: Record<OrderingProfile, LucideIcon> = {
  hospitality: UtensilsCrossed,
  quick_service: Sandwich,
  pharmacy: Pill,
  retail: ShoppingBag,
  services: CalendarClock,
  ticketing: Ticket,
  wholesale: Warehouse,
  general: Package,
};

export function useCaseIconFor(useCase?: string | null): LucideIcon {
  return ICON_BY_PROFILE[normalizeOrderingUseCase(useCase)];
}

/** Renders the resolved use-case icon. Purely presentational — size/color via className. */
export function UseCaseIllustration({
  useCase,
  className,
}: {
  useCase?: string | null;
  className?: string;
}) {
  const Icon = useCaseIconFor(useCase);
  return (
    <Icon
      className={cn("text-muted-foreground/40", className)}
      strokeWidth={1.5}
      aria-hidden="true"
    />
  );
}
