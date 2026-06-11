"use client";

import { cn } from "@/lib/utils";
import type { CatalogVariant } from "@/types/catalog";

interface VariantSelectorProps {
  variants: CatalogVariant[];
  /** Currently selected variant id, or null when none chosen yet. */
  selectedVariantId: string | null;
  onSelect: (variantId: string) => void;
  currency: string;
  /** Optional heading; defaults to "Choose an option". */
  label?: string;
}

/** Format a variant's attributes as "Red / M" (falls back to the variant name). */
export function formatVariantAttributes(variant: CatalogVariant): string {
  const parts = Object.values(variant.attributes ?? {}).filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : variant.name;
}

/**
 * Variant picker for products that have selectable variants (color/size/etc.).
 * Mirrors the radio-style modifier selector — single selection, one variant per cart line.
 */
export function VariantSelector({
  variants,
  selectedVariantId,
  onSelect,
  currency,
  label = "Choose an option",
}: VariantSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">
          {label}
          <span className="ml-2 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
            Required
          </span>
        </h3>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {variants.map((variant) => {
          const isSelected = variant.id === selectedVariantId;
          const attrs = formatVariantAttributes(variant);
          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => onSelect(variant.id)}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3 text-left transition",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50",
              )}
            >
              {/* Radio indicator */}
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition",
                  isSelected ? "border-primary bg-primary" : "border-muted-foreground/40",
                )}
              >
                {isSelected && <span className="size-2 rounded-full bg-primary-foreground" />}
              </span>

              <span className="flex flex-1 items-center justify-between gap-2">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{attrs}</span>
                  {variant.sku && (
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {variant.sku}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-sm font-semibold text-foreground">
                  {currency} {variant.price.toLocaleString()}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
