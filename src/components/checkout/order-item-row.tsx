import type { CartItem } from "@/store/cart";

export function OrderItemRow({ item }: { item: CartItem }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
          {item.quantity}
        </span>
        <span className="text-sm">{item.name}</span>
      </div>
      <span className="text-sm font-medium">KES {item.total.toLocaleString()}</span>
    </div>
  );
}
