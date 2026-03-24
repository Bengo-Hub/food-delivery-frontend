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
  modifiers?: {
    groupId: string;
    groupName: string;
    options: { id: string; name: string; price: number }[];
  }[];
  notes?: string;
  image?: string;
  inventorySku?: string;
};

interface CartState {
  items: CartItem[];
  requestUtensils: boolean;
  orderNotes: string;
  addItem: (item: {
    id: string;
    name: string;
    price: number;
    outletId?: string;
    outletName?: string;
    quantity?: number;
    modifiers?: CartItem["modifiers"];
    notes?: string;
    image?: string;
    inventorySku?: string;
  }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  subtotal: () => number;
  setRequestUtensils: (val: boolean) => void;
  setOrderNotes: (notes: string) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      requestUtensils: false,
      orderNotes: "",
      addItem: ({ id, name, price, outletId, outletName, quantity = 1, modifiers, notes, image, inventorySku }) => {
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
            ...(modifiers && { modifiers }),
            ...(notes && { notes }),
            ...(image && { image }),
            ...(inventorySku && { inventorySku }),
          };
          set({ items: [...items, newItem] });
        }
      },
      removeItem: (id) => set(({ items }) => ({ items: items.filter((i) => i.id !== id) })),
      updateQuantity: (id, quantity) =>
        set(({ items }) => ({
          items: items.map((i) => (i.id === id ? { ...i, quantity, total: i.price * quantity } : i)),
        })),
      clear: () => set({ items: [], requestUtensils: false, orderNotes: "" }),
      subtotal: () => get().items.reduce((s, i) => s + i.total, 0),
      setRequestUtensils: (val) => set({ requestUtensils: val }),
      setOrderNotes: (notes) => set({ orderNotes: notes }),
    }),
    {
      name: "ordering-cart-storage",
    },
  ),
);
