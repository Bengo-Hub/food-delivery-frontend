"use client";

import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { SiteShell } from "@/components/layout/site-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
  const diningMode = useDiningModeStore((s) => s.mode);

  const cartSubtotal = subtotal();
  const deliveryFee = diningMode === "delivery" ? (cartSubtotal > 2000 ? 0 : 150) : 0;
  const total = cartSubtotal + deliveryFee;

  if (items.length === 0) {
    return (
      <SiteShell>
        <div className="container mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 py-20 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Your cart is empty</h1>
          <p className="text-muted-foreground">Add items from the menu to get started.</p>
          <Button asChild>
            <Link href={orgRoute(orgSlug, "/menu")}>Browse Menu</Link>
          </Button>
        </div>
      </SiteShell>
    );
  }

  // Group items by outlet for display
  const outletName = items[0]?.outletName;

  return (
    <SiteShell hideBottomNav>
      <div className="container mx-auto max-w-2xl px-4 py-8">
        {/* Back navigation */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Continue shopping
        </button>

        <h1 className="mb-6 text-2xl font-bold">Your Cart</h1>

        {outletName && (
          <p className="mb-4 text-sm text-muted-foreground">
            From <span className="font-medium text-foreground">{outletName}</span>
          </p>
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
              <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                {/* Item info */}
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{formatCurrency(item.price)} each</p>
                </div>

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
                    className="flex h-7 w-7 items-center justify-center rounded-full border hover:bg-muted"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border hover:bg-muted"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                {/* Item total */}
                <p className="w-20 text-right text-sm font-semibold">
                  {formatCurrency(item.total)}
                </p>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Remove item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Order summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(cartSubtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Delivery fee
                {diningMode === "delivery" && cartSubtotal > 2000 && (
                  <span className="ml-1 text-xs text-green-600">(free over KES 2,000)</span>
                )}
              </span>
              <span>{deliveryFee === 0 ? "Free" : formatCurrency(deliveryFee)}</span>
            </div>
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
              <Link href={orgRoute(orgSlug, "/menu")}>Add more items</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </SiteShell>
  );
}
