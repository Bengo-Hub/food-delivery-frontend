import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Maximum cart age in milliseconds (24 hours). */
const CART_MAX_AGE_MS = 24 * 60 * 60 * 1000;

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
  updatedAt: number;
  sessionId: string;
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
      updatedAt: Date.now(),
      sessionId: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
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
            updatedAt: Date.now(),
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
          set({ items: [...items, newItem], updatedAt: Date.now() });
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
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as CartState;
        if (version === 0) {
          // v0 → v1: add updatedAt field, clear stale items
          return { ...state, updatedAt: Date.now() };
        }
        if (version <= 1) {
          // v1 → v2: add sessionId for guest checkout
          const sid = typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
          return { ...state, sessionId: sid };
        }
        return state as CartState;
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Clear cart items older than 24 hours to prevent stale items
        if (state.updatedAt && Date.now() - state.updatedAt > CART_MAX_AGE_MS) {
          state.items = [];
          state.updatedAt = Date.now();
          state.requestUtensils = false;
          state.orderNotes = "";
        }
      },
    },
  ),
);
