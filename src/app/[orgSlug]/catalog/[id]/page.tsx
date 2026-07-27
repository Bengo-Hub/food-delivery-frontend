"use client";

import {
  ArrowLeft,
  CalendarClock,
  Check,
  ChevronRight,
  Clock,
  Heart,
  Info,
  Minus,
  Plus,
  ShoppingCart,
  Star,
  Store,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ItemImageGallery } from "@/components/catalog/item-image-gallery";
import { AppointmentPicker } from "@/components/catalog/appointment-picker";
import {
  ModifierSelector,
  calculateModifierAdjustment,
  validateModifierSelections,
} from "@/components/catalog/modifier-selector";
import { VariantSelector, formatVariantAttributes } from "@/components/catalog/variant-selector";
import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { Skeleton } from "@/components/ui/skeleton";
import { useCatalogItem, useCatalogItems } from "@/hooks/use-catalog";
import { useOrderingConfig } from "@/hooks/use-ordering-config";
import { orgRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useCartStore } from "@/store/cart";
import type { DietaryTag } from "@/types/catalog";

const dietaryLabels: Record<DietaryTag, string> = {
  vegan: "Vegan",
  vegetarian: "Vegetarian",
  glutenFree: "Gluten Free",
  spicy: "Spicy",
  chefSpecial: "Chef's Special",
  halal: "Halal",
};

const dietaryColors: Record<DietaryTag, string> = {
  vegan: "bg-green-100 text-green-800 border-green-200",
  vegetarian: "bg-emerald-100 text-emerald-800 border-emerald-200",
  glutenFree: "bg-amber-100 text-amber-800 border-amber-200",
  spicy: "bg-red-100 text-red-800 border-red-200",
  chefSpecial: "bg-purple-100 text-purple-800 border-purple-200",
  halal: "bg-blue-100 text-blue-800 border-blue-200",
};

export default function CatalogItemPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = useOrgSlug();
  const itemId = (params?.id as string) ?? "";
  const { config: cfg } = useOrderingConfig();

  const { data: item, isLoading, error } = useCatalogItem(orgSlug, itemId);

  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [modifierSelections, setModifierSelections] = useState<Record<string, string[]>>({});
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  // SERVICE items (e.g. salon/spa) are booked for a date+time rather than just added — the
  // selection is carried in the cart line's metadata and flows through to the order.
  const [appointment, setAppointment] = useState<{ staffId: string | null; date: string; time: string } | null>(null);

  const addItem = useCartStore((state) => state.addItem);

  // Fetch related items from same category for "You might also like"
  const { data: relatedData } = useCatalogItems(
    orgSlug,
    item?.categoryId ? { category: item.categoryId } : undefined,
    1,
    6,
  );
  const relatedItems = useMemo(
    () => (relatedData?.data ?? []).filter((r) => r.id !== item?.id).slice(0, 4),
    [relatedData, item?.id],
  );

  // Initialize default modifier selections when item loads
  useEffect(() => {
    if (!item?.modifierGroups) return;
    const defaults: Record<string, string[]> = {};
    for (const group of item.modifierGroups) {
      const defaultOptions = group.options.filter((o) => o.isDefault).map((o) => o.id);
      if (defaultOptions.length > 0) {
        defaults[group.id] = defaultOptions;
      }
    }
    setModifierSelections(defaults);
  }, [item?.modifierGroups]);

  // Variants: products with selectable options (color/size/etc.). The chosen variant
  // drives the unit price, SKU, and a distinct cart line.
  const variants = useMemo(() => item?.variants ?? [], [item?.variants]);
  const hasVariants = !!item?.hasVariants && variants.length > 0;
  const selectedVariant = useMemo(
    () => variants.find((v) => v.id === selectedVariantId) ?? null,
    [variants, selectedVariantId],
  );

  // Auto-select the only/first variant so single-variant items behave like normal items.
  useEffect(() => {
    if (!hasVariants) return;
    setSelectedVariantId((prev) => (prev && variants.some((v) => v.id === prev) ? prev : variants[0]!.id));
  }, [hasVariants, variants]);

  const modifierAdjustment = useMemo(() => {
    if (!item?.modifierGroups?.length) return 0;
    return calculateModifierAdjustment(item.modifierGroups, modifierSelections);
  }, [item?.modifierGroups, modifierSelections]);

  const customizationAdjustment = useMemo(() => {
    if (!item?.customizations) return 0;
    let adj = 0;
    item.customizations.forEach((customization) => {
      const optionIds = selectedOptions[customization.id] ?? [];
      optionIds.forEach((optionId) => {
        const option = customization.options.find((o) => o.id === optionId);
        if (option) adj += option.price;
      });
    });
    return adj;
  }, [item?.customizations, selectedOptions]);

  // When a product has variants, the variant price replaces the base price.
  const basePrice = hasVariants ? (selectedVariant?.price ?? item?.price ?? 0) : (item?.price ?? 0);
  const unitPrice = basePrice + customizationAdjustment + modifierAdjustment;
  const totalPrice = unitPrice * quantity;

  const modifiersValid = useMemo(() => {
    if (!item?.modifierGroups?.length) return true;
    return validateModifierSelections(item.modifierGroups, modifierSelections);
  }, [item?.modifierGroups, modifierSelections]);

  const variantValid = !hasVariants || !!selectedVariant;

  // A line is booked for a date+time when the item is a SERVICE *or* the outlet's
  // vertical is appointment-based (services/salon/spa) — the whole storefront then
  // behaves as a booking flow (cfg.bookingMode drives it), so even a non-typed item
  // gets the appointment picker + "Book Now" CTA rather than add-to-cart quantity.
  const isAppointment = item?.itemType === "SERVICE" || cfg.bookingMode === "appointment";

  const handleOptionToggle = (customizationId: string, optionId: string, maxSelections: number) => {
    setSelectedOptions((prev) => {
      const current = prev[customizationId] || [];
      const isSelected = current.includes(optionId);
      if (isSelected) {
        return { ...prev, [customizationId]: current.filter((id) => id !== optionId) };
      }
      if (maxSelections === 1) {
        return { ...prev, [customizationId]: [optionId] };
      }
      if (current.length >= maxSelections) return prev;
      return { ...prev, [customizationId]: [...current, optionId] };
    });
  };

  const handleAddToCart = () => {
    if (!item) return;
    if (!modifiersValid) {
      toast.error("Please complete all required selections");
      return;
    }
    if (hasVariants && !selectedVariant) {
      toast.error("Please choose an option");
      return;
    }
    if (isAppointment && !appointment) {
      toast.error("Please select an appointment date and time");
      return;
    }

    const cartModifiers: {
      groupId: string;
      groupName: string;
      options: { id: string; name: string; price: number }[];
    }[] = [];

    if (item.modifierGroups) {
      for (const group of item.modifierGroups) {
        const selectedIds = modifierSelections[group.id] ?? [];
        if (selectedIds.length === 0) continue;
        cartModifiers.push({
          groupId: group.id,
          groupName: group.name,
          options: selectedIds
            .map((oid) => {
              const opt = group.options.find((o) => o.id === oid);
              return opt ? { id: opt.id, name: opt.name, price: opt.priceAdjustment } : null;
            })
            .filter((o): o is { id: string; name: string; price: number } => o !== null),
        });
      }
    }

    if (item.customizations) {
      for (const customization of item.customizations) {
        const selectedIds = selectedOptions[customization.id] ?? [];
        if (selectedIds.length === 0) continue;
        cartModifiers.push({
          groupId: customization.id,
          groupName: customization.name,
          options: selectedIds
            .map((oid) => {
              const opt = customization.options.find((o) => o.id === oid);
              return opt ? { id: opt.id, name: opt.name, price: opt.price } : null;
            })
            .filter((o): o is { id: string; name: string; price: number } => o !== null),
        });
      }
    }

    // Variant lines get a composite key so different variants stay separate lines,
    // a "<product> — <variant>" name, and the variant SKU for checkout.
    const variantAttrs = selectedVariant ? formatVariantAttributes(selectedVariant) : "";
    const lineId = selectedVariant ? `${item.id}::${selectedVariant.id}` : item.id;
    const lineName = selectedVariant ? `${item.name} — ${variantAttrs}` : item.name;

    const metadata: Record<string, unknown> = {};
    if (selectedVariant) {
      metadata.variant_id = selectedVariant.id;
      metadata.variant_sku = selectedVariant.sku;
      metadata.variant_name = selectedVariant.name;
      if (Object.keys(selectedVariant.attributes ?? {}).length > 0) {
        metadata.variant_attributes = selectedVariant.attributes;
      }
    }
    if (isAppointment && appointment) {
      metadata.is_service = true;
      metadata.appointment_date = appointment.date;
      metadata.appointment_time = appointment.time;
      if (appointment.staffId) metadata.staff_id = appointment.staffId;
    }

    addItem({
      id: lineId,
      name: lineName,
      price: unitPrice,
      outletId: item.outletId,
      outletName: item.outletName,
      quantity,
      ...(selectedVariant ? { inventorySku: selectedVariant.sku } : {}),
      ...(cartModifiers.length > 0 ? { modifiers: cartModifiers } : {}),
      ...(item.image ? { image: item.image } : {}),
      ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
    });
    toast.success(isAppointment ? `Booked ${item.name}` : `Added ${quantity} ${item.name} to cart`);
    router.back();
  };

  // --------------- Loading state ---------------
  if (isLoading) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-5xl px-4 py-6">
          <Skeleton className="mb-4 h-8 w-24" />
          <div className="grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
            </div>
            <div className="space-y-4 lg:col-span-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-8 w-32" />
            </div>
          </div>
        </div>
      </SiteShell>
    );
  }

  if (error || !item) {
    return (
      <SiteShell>
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-4 px-4 py-24">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <Info className="size-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">
            {error ? "Failed to load item" : "Item not found"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {error ? "Something went wrong. Please try again." : "This item may have been removed."}
          </p>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 size-4" />
            Go back
          </Button>
        </div>
      </SiteShell>
    );
  }

  const galleryImages: string[] = item.images?.length
    ? item.images
    : item.image
      ? [item.image]
      : [];

  const hasExtras =
    (item.modifierGroups && item.modifierGroups.length > 0) ||
    (item.customizations && item.customizations.length > 0);

  return (
    <SiteShell>
      {/* Floating back / favorite bar */}
      <div className="sticky top-16 z-20 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back
          </button>
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className={cn(
              "rounded-full p-2 transition",
              isFavorite ? "text-red-500" : "text-muted-foreground hover:text-foreground",
            )}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart className={cn("size-5", isFavorite && "fill-current")} />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-32 pt-6">
        {/* Main content: Image + Info */}
        <div className="grid gap-8 lg:grid-cols-5">
          {/* ---------- Image column ---------- */}
          <div className="lg:col-span-3">
            <div className="relative overflow-hidden rounded-2xl bg-muted">
              {galleryImages.length > 1 ? (
                <ItemImageGallery images={galleryImages} alt={item.name} useCase={cfg.profile} />
              ) : galleryImages.length === 1 ? (
                <div className="relative aspect-[4/3]">
                  <ImageWithFallback
                    src={galleryImages[0]}
                    alt={item.name}
                    useCase={cfg.profile}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    priority
                    iconClassName="size-16"
                  />
                </div>
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center">
                  <ShoppingCart className="size-16 text-muted-foreground/30" />
                </div>
              )}

              {/* Badges overlay */}
              <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                {item.featured && (
                  <Badge className="bg-yellow-500 text-white shadow-md hover:bg-yellow-500">
                    <Star className="mr-1 size-3 fill-current" /> Featured
                  </Badge>
                )}
                {!item.available && (
                  <Badge className="bg-destructive text-destructive-foreground shadow-md hover:bg-destructive">
                    Unavailable
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* ---------- Info column ---------- */}
          <div className="flex flex-col lg:col-span-2">
            {/* Outlet link */}
            {item.outletName && (
              <Link
                href={orgRoute(orgSlug, `/outlet/${item.outletId}`)}
                className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <Store className="size-3.5" />
                {item.outletName}
                <ChevronRight className="size-3" />
              </Link>
            )}

            {/* Title & price */}
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {item.name}
            </h1>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">
                {item.currency} {basePrice.toLocaleString()}
              </span>
            </div>

            {/* Manufacturer / model (retail goods) — subtle muted subtext */}
            {cfg.showMakeModel && (item.manufacturer || item.model) && (
              <p className="mt-1 text-sm text-muted-foreground">
                {[item.manufacturer, item.model].filter(Boolean).join(" · ")}
              </p>
            )}

            {/* Description */}
            {item.description && (
              <p className="mt-3 leading-relaxed text-muted-foreground">{item.description}</p>
            )}

            {/* Meta chips row */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {item.preparationTime && (
                <div className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                  <Clock className="size-3" />
                  {item.preparationTime} min
                </div>
              )}
              {item.calories && (
                <div className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                  {item.calories} cal
                </div>
              )}
              {item.category && (
                <div className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                  {item.category}
                </div>
              )}
            </div>

            {/* Dietary tags — food verticals only (vegan/spicy/chef's special make no
                sense for a pharmacy, hardware store, salon or event). */}
            {cfg.showDietaryFilters && (item.dietary ?? []).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(item.dietary ?? []).map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                      dietaryColors[tag],
                    )}
                  >
                    {dietaryLabels[tag]}
                  </span>
                ))}
              </div>
            )}

            {/* Allergens */}
            {item.allergens && item.allergens.length > 0 && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <span className="font-semibold">Allergens:</span> {item.allergens.join(", ")}
              </div>
            )}

            <hr className="my-5 border-border" />

            {/* -------- Variant selection (color/size/etc.) -------- */}
            {hasVariants && (
              <div className="mb-6">
                <VariantSelector
                  variants={variants}
                  selectedVariantId={selectedVariantId}
                  onSelect={setSelectedVariantId}
                  currency={item.currency}
                />
              </div>
            )}

            {/* -------- Modifiers / Customizations -------- */}
            {hasExtras && (
              <div className="space-y-6">
                {item.modifierGroups && item.modifierGroups.length > 0 && (
                  <ModifierSelector
                    groups={item.modifierGroups}
                    selections={modifierSelections}
                    onSelectionsChange={setModifierSelections}
                    currency={item.currency}
                  />
                )}

                {item.customizations && item.customizations.length > 0 && (
                  <div className="space-y-5">
                    {item.customizations.map((customization) => (
                      <div key={customization.id}>
                        <div className="mb-2 flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-foreground">
                            {customization.name}
                            {customization.required && (
                              <span className="ml-1.5 text-[10px] font-bold uppercase text-destructive">
                                Required
                              </span>
                            )}
                          </h3>
                          {customization.maxSelections > 1 && (
                            <span className="text-[11px] text-muted-foreground">
                              Select up to {customization.maxSelections}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          {customization.options.map((option) => {
                            const isSelected = selectedOptions[customization.id]?.includes(
                              option.id,
                            );
                            return (
                              <button
                                key={option.id}
                                onClick={() =>
                                  handleOptionToggle(
                                    customization.id,
                                    option.id,
                                    customization.maxSelections,
                                  )
                                }
                                disabled={!option.available}
                                className={cn(
                                  "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition",
                                  isSelected
                                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                    : "border-border hover:border-primary/30 hover:bg-muted/50",
                                  !option.available && "cursor-not-allowed opacity-40",
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={cn(
                                      "flex size-5 items-center justify-center rounded-full border-2 transition",
                                      isSelected
                                        ? "border-primary bg-primary"
                                        : "border-muted-foreground/30",
                                    )}
                                  >
                                    {isSelected && <Check className="size-3 text-white" />}
                                  </div>
                                  <span className="text-sm font-medium">{option.name}</span>
                                </div>
                                {option.price > 0 && (
                                  <span className="text-sm text-muted-foreground">
                                    +{item.currency} {option.price.toLocaleString()}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ---------- Service appointment (SERVICE items / services vertical) ---------- */}
        {isAppointment && (
          <div className="mt-8">
            <hr className="mb-8 border-border" />
            <h2 className="mb-4 text-lg font-bold text-foreground">Choose an appointment</h2>
            <AppointmentPicker
              durationMinutes={item.durationMinutes ?? 30}
              onSelect={setAppointment}
            />
            {!appointment && (
              <p className="mt-3 text-sm text-muted-foreground">Select a date and time to continue.</p>
            )}
          </div>
        )}

        {/* ---------- You might also like ---------- */}
        {relatedItems.length > 0 && (
          <div className="mt-12">
            <hr className="mb-8 border-border" />
            <h2 className="mb-4 text-lg font-bold text-foreground">You might also like</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {relatedItems.map((related) => (
                <Link
                  key={related.id}
                  href={`/${orgSlug}/catalog/${related.id}`}
                  className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative aspect-square bg-muted">
                    <ImageWithFallback
                      src={related.image}
                      alt={related.name}
                      useCase={cfg.profile}
                      fill
                      className="object-cover transition group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, 25vw"
                      iconClassName="size-8"
                    />
                  </div>
                  <div className="p-2.5">
                    <p className="truncate text-sm font-medium text-foreground">{related.name}</p>
                    <p className="mt-0.5 text-sm font-semibold text-primary">
                      {related.currency} {related.price.toLocaleString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============ Sticky bottom bar ============ */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
          {/* Price breakdown (compact) */}
          <div className="hidden flex-1 sm:block">
            {(modifierAdjustment > 0 || customizationAdjustment > 0 || quantity > 1) && (
              <div className="text-xs text-muted-foreground">
                {item.currency} {unitPrice.toLocaleString()} x {quantity}
              </div>
            )}
            <div className="text-lg font-bold text-foreground">
              {item.currency} {totalPrice.toLocaleString()}
            </div>
          </div>

          {/* Quantity selector */}
          <div className="flex items-center gap-1 rounded-full border border-border bg-muted/50 p-1">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="flex size-9 items-center justify-center rounded-full transition hover:bg-background"
              aria-label="Decrease quantity"
            >
              <Minus className="size-4" />
            </button>
            <span className="w-8 text-center text-sm font-bold">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary/90"
              aria-label="Increase quantity"
            >
              <Plus className="size-4" />
            </button>
          </div>

          {/* Primary CTA — label + icon adapt to the vertical: "Book Now"/calendar for
              appointment verticals, the vertical's ctaLabel otherwise. While required
              selections (variant/modifiers/time) are outstanding, show selectOptionsLabel
              ("Choose a Time" / "Select Options") instead of the final action label. */}
          {(() => {
            const needsSelection =
              (hasVariants && !selectedVariant) || !modifiersValid || (isAppointment && !appointment);
            const ctaText = needsSelection ? cfg.selectOptionsLabel : cfg.ctaLabel;
            const CtaIcon = isAppointment ? CalendarClock : ShoppingCart;
            return (
              <Button
                onClick={handleAddToCart}
                disabled={!item.available || !modifiersValid || !variantValid || (isAppointment && !appointment)}
                size="lg"
                className="min-w-[180px] gap-2 rounded-xl text-base font-semibold shadow-lg sm:min-w-[220px]"
              >
                <CtaIcon className="size-5" />
                <span className="sm:hidden">
                  {item.currency} {totalPrice.toLocaleString()}
                </span>
                <span className="hidden sm:inline">
                  {ctaText} &middot; {item.currency} {totalPrice.toLocaleString()}
                </span>
              </Button>
            );
          })()}
        </div>

        {/* Validation messages */}
        {(!item.available || (!modifiersValid && item.available)) && (
          <div className="border-t border-border bg-destructive/5 px-4 py-2 text-center text-xs font-medium text-destructive">
            {!item.available
              ? "This item is currently unavailable"
              : "Please complete all required modifier selections"}
          </div>
        )}
      </div>
    </SiteShell>
  );
}
