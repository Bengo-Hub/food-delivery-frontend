"use client";

import { MapPin, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Address } from "@/lib/api/addresses";
import { cn } from "@/lib/utils";

interface AddressSelectorProps {
  addresses: Address[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddNew: () => void;
}

export function AddressSelector({ addresses, selectedId, onSelect, onAddNew }: AddressSelectorProps) {
  return (
    <section className="rounded-xl border border-border p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <MapPin className="size-4 text-primary" />
        <span>Delivery Address</span>
      </div>

      {addresses.length === 0 ? (
        <div className="py-3 text-center">
          <p className="mb-3 text-sm text-muted-foreground">No saved addresses yet.</p>
          <Button variant="outline" size="sm" onClick={onAddNew} className="gap-1.5">
            <Plus className="size-4" />
            Add Delivery Address
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {addresses.map((addr) => {
            const selected = selectedId === addr.id;
            return (
              <button
                key={addr.id}
                type="button"
                onClick={() => onSelect(addr.id)}
                className={cn(
                  "flex w-full min-h-[52px] items-center gap-3 rounded-xl border p-3.5 text-left transition-colors active:scale-[0.98]",
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50",
                )}
              >
                <div
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full border-2",
                    selected ? "border-primary" : "border-muted-foreground/40",
                  )}
                >
                  {selected && <div className="size-2.5 rounded-full bg-primary" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{addr.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{addr.address}</p>
                </div>
                {addr.isDefault && (
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    Default
                  </span>
                )}
              </button>
            );
          })}

          <Button
            variant="ghost"
            size="sm"
            onClick={onAddNew}
            className="mt-1 w-full gap-1.5 text-muted-foreground"
          >
            <Plus className="size-4" />
            Add new address
          </Button>
        </div>
      )}
    </section>
  );
}
