import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  id: string;
  name: string;
  quantity: number;
  price: number; // numeric price in smallest unit (KES)
  total: number;
  outletId?: string;
  outletName?: string;
};

interface CartState {
  items: CartItem[];
  addItem: (item: {
    id: string;
    name: string;
    price: number;
    outletId?: string;
    outletName?: string;
    quantity?: number;
  }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  subtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: ({ id, name, price, outletId, outletName, quantity = 1 }) => {
        const items = get().items;
        const existing = items.find((i) => i.id === id);
        if (existing) {
          set({
            items: items.map((i) =>
              i.id === id
                ? { ...i, quantity: i.quantity + quantity, total: (i.quantity + quantity) * i.price }
                : i,
            ),
          });
        } else {
          const newItem: CartItem = {
            id,
            name,
            quantity,
            price,
            total: price * quantity,
            ...(outletId && { outletId }),
            ...(outletName && { outletName }),
          };
          set({ items: [...items, newItem] });
        }
      },
      removeItem: (id) => set(({ items }) => ({ items: items.filter((i) => i.id !== id) })),
      updateQuantity: (id, quantity) =>
        set(({ items }) => ({
          items: items.map((i) => (i.id === id ? { ...i, quantity, total: i.price * quantity } : i)),
        })),
      clear: () => set({ items: [] }),
      subtotal: () => get().items.reduce((s, i) => s + i.total, 0),
    }),
    {
      name: "ordering-cart-storage",
    },
  ),
);
