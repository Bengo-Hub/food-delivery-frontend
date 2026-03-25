"use client";

import { Plus } from "lucide-react";
import Image from "next/image";

import type { MenuItem } from "@/types/catalog";

interface PeopleAlsoAddedProps {
  items: MenuItem[];
  onAddToCart: (item: MenuItem) => void;
}

export function PeopleAlsoAdded({ items, onAddToCart }: PeopleAlsoAddedProps) {
  if (!items.length) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-foreground">People also added</h3>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex w-36 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card"
          >
            {/* Thumbnail */}
            <div className="relative aspect-square bg-muted">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="144px"
                />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <span className="text-2xl opacity-30">🍽️</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col justify-between p-2">
              <p className="line-clamp-2 text-xs font-medium text-foreground">{item.name}</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  {item.currency} {item.price.toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={() => onAddToCart(item)}
                  className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                  aria-label={`Add ${item.name} to cart`}
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
