import { OrderItemRow } from "@/components/checkout/order-item-row";
import type { CartItem } from "@/store/cart";

interface OrderSummarySectionProps {
  items: CartItem[];
}

export function OrderSummarySection({ items }: OrderSummarySectionProps) {
  return (
    <section className="rounded-xl border border-border p-4">
      <h2 className="mb-3 text-sm font-medium">Order Summary</h2>
      <div className="divide-y divide-border">
        {items.map((item) => (
          <OrderItemRow key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
