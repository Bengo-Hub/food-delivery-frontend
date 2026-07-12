"use client";

import { ArrowLeft, Minus, Plus, Store, Trash2, Utensils } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { SiteShell } from "@/components/layout/site-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useFeeBreakdown } from "@/hooks/use-cart-api";
import { useOutlet } from "@/hooks/use-catalog";
import { useOrderingConfig } from "@/hooks/use-ordering-config";
import { orgRoute } from "@/lib/routes";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useCartStore } from "@/store/cart";
import { useDiningModeStore } from "@/store/dining-mode";

function formatCurrency(amount: number) {
  return `KES ${amount.toLocaleString("en-KE", { minimumFractionDigits: 0 })}`;
}

export default function CartPage() {
  const router = useRouter();
  const orgSlug = useOrgSlug();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const orderNotes = useCartStore((s) => s.orderNotes);
  const setOrderNotes = useCartStore((s) => s.setOrderNotes);
  const requestUtensils = useCartStore((s) => s.requestUtensils);
  const setRequestUtensils = useCartStore((s) => s.setRequestUtensils);
  const diningMode = useDiningModeStore((s) => s.mode);
  const { config: cfg, copy } = useOrderingConfig();

  const cartSubtotal = subtotal();

  // Event tickets are bought on their own — no delivery/pickup, fees, or utensils.
  const ticketOnly = items.length > 0 && items.every((i) => (i.metadata as { is_ticket?: boolean } | undefined)?.is_ticket === true);
  // Appointment/service bookings likewise have no delivery/pickup/utensils — the customer
  // visits the provider at the booked time (metadata.is_service, set on the service page).
  const appointmentOnly = items.length > 0 && items.every((i) => (i.metadata as { is_service?: boolean } | undefined)?.is_service === true);
  // Booking carts skip the whole fulfillment/fees flow.
  const noFulfillment = ticketOnly || appointmentOnly;

  // Fetch fee breakdown from backend using the first item's outlet and current dining mode
  const outletId = items[0]?.outletId ?? null;
  const { data: feeData } = useFeeBreakdown(outletId, diningMode);
  const deliveryFee = feeData?.delivery_fee ?? 0;
  const serviceFee = noFulfillment ? 0 : (feeData?.service_fee ?? 0);
  const total = noFulfillment ? cartSubtotal : (feeData?.grand_total ?? cartSubtotal + deliveryFee + serviceFee);

  if (items.length === 0) {
    return (
      <SiteShell>
        <div className="container mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 py-20 text-center">
          <span className="text-6xl" aria-hidden>{cfg.placeholderGlyph}</span>
          <h1 className="text-2xl font-bold">Your cart is empty</h1>
          <p className="text-muted-foreground">Add {copy.itemLabelPlural.toLowerCase()} to get started.</p>
          <Button asChild>
            <Link href={orgRoute(orgSlug, "/catalog")}>Browse Catalog</Link>
          </Button>
        </div>
      </SiteShell>
    );
  }

  // Group items by outlet for display
  const outletName = items[0]?.outletName;

  // Fetch outlet details for address display
  const { data: outletData } = useOutlet(orgSlug, outletId ?? "");

  return (
    <SiteShell hideBottomNav>
      <div className="container mx-auto max-w-2xl px-4 py-8">
        {/* Back to store navigation */}
        {outletId ? (
          <Link
            href={orgRoute(orgSlug, `/outlet/${outletId}`)}
            className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to store
          </Link>
        ) : (
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Continue shopping
          </button>
        )}

        <h1 className="mb-6 text-2xl font-bold">Your Cart</h1>

        {/* Store name/location header */}
        {outletName && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3">
            <Store className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">{outletName}</p>
              {outletData?.address && (
                <p className="text-xs text-muted-foreground">{outletData.address}</p>
              )}
              {!noFulfillment && (
                <p className="text-xs text-muted-foreground">
                  {diningMode === "delivery" ? "Delivery" : "Pickup"}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Cart items */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">
              {items.length} {items.length === 1 ? "item" : "items"}
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y p-0">
            {items.map((item) => (
              <div key={item.id} className="px-4 py-4 sm:px-6">
                {/* Mobile: stacked layout / Desktop: row layout */}
                <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                  {/* Item info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(item.price)} each</p>
                  </div>

                  {/* Remove - top right on mobile */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="shrink-0 p-1 text-muted-foreground hover:text-destructive active:text-destructive"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Quantity + Total row */}
                <div className="mt-2 flex items-center justify-between">
                  {/* Quantity controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (item.quantity <= 1) {
                          removeItem(item.id);
                        } else {
                          updateQuantity(item.id, item.quantity - 1);
                        }
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full border hover:bg-muted active:bg-muted/80 sm:h-7 sm:w-7"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border hover:bg-muted active:bg-muted/80 sm:h-7 sm:w-7"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Item total */}
                  <p className="text-sm font-semibold">
                    {formatCurrency(item.total)}
                  </p>
                </div>

                {/* Modifier details */}
                {item.modifiers && item.modifiers.length > 0 && (
                  <div className="mt-1.5 ml-0 space-y-0.5">
                    {item.modifiers.map((mod) => (
                      <p key={mod.groupId} className="text-xs text-muted-foreground">
                        {mod.options.map((opt) => (
                          <span key={opt.id}>
                            {opt.name}
                            {opt.price > 0 && ` +${formatCurrency(opt.price)}`}
                          </span>
                        )).reduce<React.ReactNode[]>((acc, el, idx) => {
                          if (idx > 0) acc.push(", ");
                          acc.push(el);
                          return acc;
                        }, [])}
                      </p>
                    ))}
                  </div>
                )}

                {/* Per-item notes */}
                {item.notes && (
                  <p className="mt-1 text-xs italic text-muted-foreground">
                    Note: {item.notes}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Order preferences — not applicable to event tickets */}
        {!ticketOnly && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">Order Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Request utensils — food verticals only (a pharmacy/retail/salon order
                has no cutlery). */}
            {cfg.showDietaryFilters && (
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={requestUtensils}
                  onChange={(e) => setRequestUtensils(e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <div className="flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Request utensils, napkins, etc.</span>
                </div>
              </label>
            )}

            {/* Order notes */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Order notes <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <Textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Any special instructions for your order..."
                rows={3}
                className="resize-none text-sm"
              />
            </div>
          </CardContent>
        </Card>
        )}

        {/* Order summary / fee breakdown */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(cartSubtotal)}</span>
            </div>
            {!noFulfillment && diningMode === "delivery" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Delivery fee
                </span>
                <span>{deliveryFee === 0 ? <span className="text-green-600">Free</span> : formatCurrency(deliveryFee)}</span>
              </div>
            )}
            {!noFulfillment && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service fee</span>
                <span>{formatCurrency(serviceFee)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button
              className="w-full"
              size="lg"
              onClick={() => router.push(orgRoute(orgSlug, "/checkout"))}
            >
              Proceed to Checkout
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href={orgRoute(orgSlug, "/catalog")}>Add more {copy.itemLabelPlural.toLowerCase()}</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </SiteShell>
  );
}
