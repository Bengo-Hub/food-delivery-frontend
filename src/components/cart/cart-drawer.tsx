"use client";

import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { orgRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useCartStore, type CartItem } from "@/store/cart";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CartItemRow({ item }: { item: CartItem }) {
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const handleDecrease = () => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    } else {
      removeItem(item.id);
    }
  };

  const handleIncrease = () => {
    updateQuantity(item.id, item.quantity + 1);
  };

  return (
    <div className="flex items-start gap-3 border-b border-border py-4 last:border-b-0">
      {/* Item image placeholder */}
      <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-muted">
        <ShoppingBag className="size-6 text-muted-foreground" />
      </div>

      {/* Item details */}
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="text-sm font-medium text-foreground">{item.name}</h4>
            {item.outletName && <p className="text-xs text-muted-foreground">{item.outletName}</p>}
          </div>
          <button
            onClick={() => removeItem(item.id)}
            className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:text-destructive active:bg-destructive/10"
            aria-label={`Remove ${item.name}`}
          >
            <Trash2 className="size-4" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">
            KES {item.total.toLocaleString()}
          </span>

          {/* Quantity controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDecrease}
              className="flex size-9 items-center justify-center rounded-full bg-muted text-foreground active:bg-muted/60"
              aria-label="Decrease quantity"
            >
              <Minus className="size-4" />
            </button>
            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
            <button
              onClick={handleIncrease}
              className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground active:bg-primary/80"
              aria-label="Increase quantity"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const orgSlug = useOrgSlug();
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore((state) => state.subtotal);
  const clear = useCartStore((state) => state.clear);

  const handleClose = () => {
    onOpenChange(false);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = subtotal();

  // Delivery fee: can be from backend by outlet/distance when API is wired
  const deliveryFee = cartSubtotal > 0 ? (cartSubtotal > 2000 ? 0 : 150) : 0;
  const total = cartSubtotal + deliveryFee;

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50" onClick={handleClose} aria-hidden />

      {/* Drawer - Right side slide in (Uber Eats style) */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-background shadow-2xl",
          "duration-300 animate-in slide-in-from-right",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-5" />
            <h2 className="text-lg font-semibold">Your Cart</h2>
            {itemCount > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                {itemCount}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="rounded-full p-2 hover:bg-muted"
            aria-label="Close cart"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Cart Content */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
            <div className="flex size-20 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="size-10 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold">Your cart is empty</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add items from the menu to get started
              </p>
            </div>
            <Button onClick={handleClose} asChild>
              <Link href={orgRoute(orgSlug, "/menu")}>Browse Menu</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Items list */}
            <div className="flex-1 overflow-y-auto px-4">
              {items.map((item) => (
                <CartItemRow key={item.id} item={item} />
              ))}
            </div>

            {/* Clear cart button */}
            <div className="border-t border-border px-4 py-2">
              <button
                onClick={clear}
                className="text-sm text-muted-foreground hover:text-destructive hover:underline"
              >
                Clear cart
              </button>
            </div>

            {/* Order Summary */}
            <div className="border-t border-border bg-muted/30 px-4 py-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">KES {cartSubtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery fee</span>
                  <span className="font-medium">
                    {deliveryFee === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      `KES ${deliveryFee.toLocaleString()}`
                    )}
                  </span>
                </div>
                {deliveryFee > 0 && cartSubtotal < 2000 && (
                  <p className="text-xs text-muted-foreground">
                    Add KES {(2000 - cartSubtotal).toLocaleString()} more for free delivery
                  </p>
                )}
                <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                  <span>Total</span>
                  <span>KES {total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Checkout Button */}
            <div className="border-t border-border p-4 safe-area-pb">
              <Button asChild className="w-full min-h-[48px]" size="lg">
                <Link href={orgRoute(orgSlug, "/checkout")} onClick={handleClose}>
                  Proceed to Checkout
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
