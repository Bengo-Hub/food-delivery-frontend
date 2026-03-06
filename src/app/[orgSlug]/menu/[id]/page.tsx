"use client";

import { ArrowLeft, Clock, Heart, Minus, Plus, ShoppingCart, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { SiteShell } from "@/components/layout/site-shell";
import { Button } from "@/components/ui/button";
import { useMenuItem } from "@/hooks/use-menu";
import { orgRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useCartStore } from "@/store/cart";
import type { DietaryTag } from "@/types/menu";

const dietaryLabels: Record<DietaryTag, string> = {
  vegan: "Vegan",
  vegetarian: "Vegetarian",
  glutenFree: "Gluten Free",
  spicy: "Spicy",
  chefSpecial: "Chef's Special",
  halal: "Halal",
};

export default function MenuItemPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = useOrgSlug();
  const itemId = (params?.id as string) ?? "";

  const { data: item, isLoading, error } = useMenuItem(orgSlug, itemId);

  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [isFavorite, setIsFavorite] = useState(false);

  const addItem = useCartStore((state) => state.addItem);

  const calculateTotalPrice = () => {
    if (!item) return 0;
    let total = item.price * quantity;
    item.customizations?.forEach((customization) => {
      const optionIds = selectedOptions[customization.id] ?? [];
      optionIds.forEach((optionId) => {
        const option = customization.options.find((o) => o.id === optionId);
        if (option) total += option.price * quantity;
      });
    });
    return total;
  };

  const handleOptionToggle = (customizationId: string, optionId: string, maxSelections: number) => {
    setSelectedOptions((prev) => {
      const current = prev[customizationId] || [];
      const isSelected = current.includes(optionId);

      if (isSelected) {
        return {
          ...prev,
          [customizationId]: current.filter((id) => id !== optionId),
        };
      }

      if (maxSelections === 1) {
        return {
          ...prev,
          [customizationId]: [optionId],
        };
      }

      if (current.length >= maxSelections) {
        return prev;
      }

      return {
        ...prev,
        [customizationId]: [...current, optionId],
      };
    });
  };

  const handleAddToCart = () => {
    if (!item) return;
    addItem({
      id: item.id,
      name: item.name,
      price: calculateTotalPrice() / quantity,
      outletId: item.outletId,
      outletName: item.outletName,
      quantity,
    });
    toast.success(`Added ${quantity} ${item.name} to cart`);
    router.back();
  };

  if (isLoading) {
    return (
      <SiteShell>
        <div className="mx-auto flex max-w-4xl items-center justify-center px-4 py-16 text-muted-foreground">
          Loading menu item...
        </div>
      </SiteShell>
    );
  }
  if (error || !item) {
    return (
      <SiteShell>
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-4 px-4 py-16">
          <p className="text-muted-foreground">
            {error ? "Failed to load menu item." : "Menu item not found."}
          </p>
          <Button variant="outline" onClick={() => router.back()}>
            Go back
          </Button>
        </div>
      </SiteShell>
    );
  }

  const totalPrice = calculateTotalPrice();

  return (
    <SiteShell>
      {/* Back Button */}
      <div className="sticky top-16 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
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

      <div className="mx-auto w-full max-w-4xl px-4 py-6">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image Section */}
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
            {item.image ? (
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <span className="text-6xl opacity-30">🍽️</span>
              </div>
            )}
            {item.featured && (
              <div className="absolute left-4 top-4">
                <span className="flex items-center gap-1 rounded-full bg-yellow-500 px-3 py-1 text-xs font-semibold text-white">
                  <Star className="size-3 fill-current" />
                  Featured
                </span>
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="flex flex-col">
            {/* Header */}
            <div className="space-y-3">
              <Link
                href={orgRoute(orgSlug, `/outlet/${item.outletId}`)}
                className="text-sm font-medium text-primary hover:underline"
              >
                {item.outletName}
              </Link>
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{item.name}</h1>
              <p className="text-muted-foreground">{item.description}</p>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {item.preparationTime && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="size-4" />
                    <span>{item.preparationTime} min</span>
                  </div>
                )}
                {item.calories && (
                  <span className="text-sm text-muted-foreground">{item.calories} cal</span>
                )}
                {(item.dietary ?? []).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                  >
                    {dietaryLabels[tag]}
                  </span>
                ))}
              </div>

              {/* Allergens */}
              {item.allergens && item.allergens.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Allergens:</span> {item.allergens.join(", ")}
                </p>
              )}

              {/* Price */}
              <div className="pt-2">
                <span className="text-2xl font-bold text-foreground">
                  {item.currency} {item.price.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Customizations */}
            {item.customizations && item.customizations.length > 0 && (
              <div className="mt-6 space-y-6">
                {item.customizations.map((customization) => (
                  <div key={customization.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">
                        {customization.name}
                        {customization.required && (
                          <span className="ml-1 text-xs text-destructive">*Required</span>
                        )}
                      </h3>
                      {customization.maxSelections > 1 && (
                        <span className="text-xs text-muted-foreground">
                          Select up to {customization.maxSelections}
                        </span>
                      )}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {customization.options.map((option) => {
                        const isSelected = selectedOptions[customization.id]?.includes(option.id);
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
                              "flex items-center justify-between rounded-lg border p-3 text-left transition",
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50",
                              !option.available && "cursor-not-allowed opacity-50",
                            )}
                          >
                            <span className="text-sm font-medium">{option.name}</span>
                            {option.price > 0 && (
                              <span className="text-sm text-muted-foreground">
                                +{item.currency} {option.price}
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

            {/* Quantity and Add to Cart */}
            <div className="mt-auto space-y-4 pt-6">
              {/* Quantity Selector */}
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">Quantity</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex size-10 items-center justify-center rounded-full border border-border hover:bg-muted"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="size-4" />
                  </button>
                  <span className="w-8 text-center text-lg font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                    aria-label="Increase quantity"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <Button
                onClick={handleAddToCart}
                disabled={!item.available}
                className="w-full"
                size="lg"
              >
                <ShoppingCart className="mr-2 size-5" />
                Add to Cart - {item.currency} {totalPrice.toLocaleString()}
              </Button>

              {!item.available && (
                <p className="text-center text-sm text-destructive">
                  This item is currently unavailable
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
