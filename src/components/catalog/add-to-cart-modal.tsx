"use client";

import { useEffect, useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import {
  ModifierSelector,
  calculateModifierAdjustment,
  validateModifierSelections,
} from "@/components/catalog/modifier-selector";
import { VariantSelector, formatVariantAttributes } from "@/components/catalog/variant-selector";
import { useCartStore } from "@/store/cart";
import type { CatalogVariant, ModifierGroup } from "@/types/catalog";

/** The subset of MenuItem fields the modal needs — every call site (grid card, featured
 *  carousel, outlet-detail card) can supply this from its own already-fetched item shape. */
export interface AddToCartModalItem {
  id: string;
  name: string;
  description?: string | undefined;
  price: number;
  currency?: string | undefined;
  image?: string | undefined;
  outletId?: string | undefined;
  outletName?: string | undefined;
  hasVariants?: boolean | undefined;
  variants?: CatalogVariant[] | undefined;
  modifierGroups?: ModifierGroup[] | undefined;
}

/** Whether an item needs the modal at all — items with neither variants nor modifiers should
 *  keep instant-adding (unchanged existing behavior), matching Uber Eats' own UX. */
export function needsAddToCartModal(item: Pick<AddToCartModalItem, "hasVariants" | "modifierGroups">): boolean {
  return !!item.hasVariants || (item.modifierGroups?.length ?? 0) > 0;
}

interface AddToCartModalProps {
  /** The item to configure, or null when the modal is closed. */
  item: AddToCartModalItem | null;
  onClose: () => void;
  /** Called after a successful add, in addition to the built-in toast. */
  onAdded?: () => void;
}

export function AddToCartModal({ item, onClose, onAdded }: AddToCartModalProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const [modifierSelections, setModifierSelections] = useState<Record<string, string[]>>({});
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  const currency = item?.currency ?? "KES";
  const variants = useMemo(() => item?.variants ?? [], [item?.variants]);
  const hasVariants = !!item?.hasVariants && variants.length > 0;
  const selectedVariant = useMemo(
    () => variants.find((v) => v.id === selectedVariantId) ?? null,
    [variants, selectedVariantId],
  );

  // Reset transient state and seed defaults whenever a new item opens.
  useEffect(() => {
    if (!item) return;
    setQuantity(1);
    const defaults: Record<string, string[]> = {};
    for (const group of item.modifierGroups ?? []) {
      const defaultOptions = group.options.filter((o) => o.isDefault).map((o) => o.id);
      if (defaultOptions.length > 0) defaults[group.id] = defaultOptions;
    }
    setModifierSelections(defaults);
    setSelectedVariantId(item.hasVariants && (item.variants?.length ?? 0) > 0 ? item.variants![0]!.id : null);
  }, [item]);

  const modifierAdjustment = useMemo(() => {
    if (!item?.modifierGroups?.length) return 0;
    return calculateModifierAdjustment(item.modifierGroups, modifierSelections);
  }, [item?.modifierGroups, modifierSelections]);

  const modifiersValid = useMemo(() => {
    if (!item?.modifierGroups?.length) return true;
    return validateModifierSelections(item.modifierGroups, modifierSelections);
  }, [item?.modifierGroups, modifierSelections]);

  const variantValid = !hasVariants || !!selectedVariant;

  const basePrice = hasVariants ? (selectedVariant?.price ?? item?.price ?? 0) : (item?.price ?? 0);
  const unitPrice = basePrice + modifierAdjustment;
  const totalPrice = unitPrice * quantity;

  const canConfirm = !!item && modifiersValid && variantValid;

  const handleConfirm = () => {
    if (!item || !canConfirm) {
      toast.error(!variantValid ? "Please choose an option" : "Please complete all required selections");
      return;
    }

    const cartModifiers: {
      groupId: string;
      groupName: string;
      options: { id: string; name: string; price: number }[];
    }[] = [];
    for (const group of item.modifierGroups ?? []) {
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

    addItem({
      id: lineId,
      name: lineName,
      price: unitPrice,
      quantity,
      ...(item.outletId ? { outletId: item.outletId } : {}),
      ...(item.outletName ? { outletName: item.outletName } : {}),
      ...(selectedVariant ? { inventorySku: selectedVariant.sku } : {}),
      ...(cartModifiers.length > 0 ? { modifiers: cartModifiers } : {}),
      ...(item.image ? { image: item.image } : {}),
      ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
    });
    toast.success(`Added ${quantity} ${item.name} to cart`);
    onAdded?.();
    onClose();
  };

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        {item && (
          <>
            <div className="relative h-40 w-full shrink-0 bg-muted sm:h-48">
              <ImageWithFallback
                src={item.image}
                alt={item.name}
                fill
                className="object-cover"
                sizes="512px"
                iconClassName="size-10"
              />
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-4 pt-4">
              <DialogHeader className="items-start gap-1 text-left">
                <DialogTitle className="text-lg">{item.name}</DialogTitle>
                {item.description && (
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                )}
                <p className="pt-1 text-base font-semibold text-foreground">
                  {currency} {basePrice.toLocaleString()}
                </p>
              </DialogHeader>

              <div className="mt-4 space-y-6">
                {hasVariants && (
                  <VariantSelector
                    variants={variants}
                    selectedVariantId={selectedVariantId}
                    onSelect={setSelectedVariantId}
                    currency={currency}
                  />
                )}
                {!!item.modifierGroups?.length && (
                  <ModifierSelector
                    groups={item.modifierGroups}
                    selections={modifierSelections}
                    onSelectionsChange={setModifierSelections}
                    currency={currency}
                  />
                )}
              </div>
            </div>

            <DialogFooter className="flex-row items-center gap-3 border-t border-border bg-background px-5 py-4 sm:justify-between">
              <div className="flex items-center gap-3 rounded-full border border-border px-2 py-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex size-8 items-center justify-center rounded-full text-foreground transition hover:bg-muted disabled:opacity-40"
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-4 text-center text-sm font-semibold">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="flex size-8 items-center justify-center rounded-full text-foreground transition hover:bg-muted"
                  aria-label="Increase quantity"
                >
                  <Plus className="size-4" />
                </button>
              </div>
              <Button className="flex-1" size="lg" disabled={!canConfirm} onClick={handleConfirm}>
                Add to cart · {currency} {totalPrice.toLocaleString()}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
