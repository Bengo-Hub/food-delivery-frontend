"use client";

import { Search, ShoppingCart } from "lucide-react";
import { useMemo } from "react";

import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { MenuItem } from "@/types/catalog";

/** Deterministic anchor id for a category section, shared with OutletSidebar's nav links. */
export function categoryAnchorId(category: string): string {
  return `menu-cat-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "other"}`;
}

interface OutletMenuSectionProps {
  items: MenuItem[];
  search: string;
  onSearchChange: (value: string) => void;
  onAddToCart: (item: MenuItem) => void;
  useCase?: string | undefined;
}

/**
 * Category-anchored, continuously-scrollable menu list (search filters items; category
 * navigation — the sidebar's jump links — scrolls to a section rather than hiding the rest,
 * since every section must stay mounted for scroll-spy/jump-to-category to work).
 */
export function OutletMenuSection({ items, search, onSearchChange, onAddToCart, useCase }: OutletMenuSectionProps) {
  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) => item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q),
    );
  }, [items, search]);

  const itemsByCategory = useMemo(() => {
    const groups = new Map<string, MenuItem[]>();
    for (const item of filteredItems) {
      const key = item.category || "Other";
      const bucket = groups.get(key);
      if (bucket) bucket.push(item);
      else groups.set(key, [item]);
    }
    return groups;
  }, [filteredItems]);

  return (
    <div className="space-y-8">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search menu items…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-muted-foreground">
            {items.length === 0 ? "This outlet has no items available right now." : "No items match your search."}
          </p>
        </div>
      ) : (
        Array.from(itemsByCategory.entries()).map(([category, categoryItems]) => (
          <section key={category} id={categoryAnchorId(category)} className="scroll-mt-40">
            <h2 className="mb-4 text-lg font-semibold text-foreground">{category}</h2>
            <div className="space-y-4">
              {categoryItems.map((item) => (
                <OutletMenuItemCard key={item.id} item={item} useCase={useCase} onAddToCart={() => onAddToCart(item)} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function OutletMenuItemCard({
  item,
  useCase,
  onAddToCart,
}: {
  item: MenuItem;
  useCase?: string | undefined;
  onAddToCart: () => void;
}) {
  const opensModal = !!item.hasVariants || (item.modifierGroups?.length ?? 0) > 0;
  return (
    <div className="group flex gap-4 rounded-xl border border-border bg-card p-4 transition hover:shadow-md">
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-foreground">{item.name}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">
              {item.currency} {item.price.toLocaleString()}
            </span>
            {item.originalPrice && item.originalPrice > item.price && (
              <span className="text-xs text-muted-foreground line-through">
                {item.currency} {item.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          <Button size="sm" variant={opensModal ? "outline" : "default"} onClick={onAddToCart}>
            <ShoppingCart className="mr-1 size-3" />
            {opensModal ? "Select" : "Add"}
          </Button>
        </div>
      </div>
      <div className={cn("relative size-24 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-28")}>
        <ImageWithFallback
          src={item.image}
          alt={item.name}
          useCase={useCase}
          fill
          className="object-cover transition group-hover:scale-105"
          sizes="112px"
          iconClassName="size-7"
        />
        {item.discountPercent && item.discountPercent > 0 && (
          <div className="absolute left-1 top-1">
            <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              -{item.discountPercent}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
