import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";

/** Maximum cart age in milliseconds (24 hours). */
const CART_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** A line is an event ticket when its metadata carries is_ticket=true. */
const isTicketLine = (metadata?: Record<string, unknown>): boolean => metadata?.is_ticket === true;

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
  metadata?: Record<string, unknown>; // per-line metadata (e.g. event ticket tier_id/is_ticket)
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
    metadata?: Record<string, unknown>;
  }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  /** Shallow-merge a patch into a line's metadata (e.g. per-ticket attendees). */
  updateItemMetadata: (id: string, patch: Record<string, unknown>) => void;
  clear: () => void;
  subtotal: () => number;
  isTicketOnly: () => boolean;
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
      addItem: ({ id, name, price, outletId, outletName, quantity = 1, modifiers, notes, image, inventorySku, metadata }) => {
        const items = get().items;
        // Tickets must be purchased on their own — block mixing event tickets with food/menu items.
        const addingTicket = isTicketLine(metadata);
        const cartHasTickets = items.some((i) => isTicketLine(i.metadata));
        const cartHasFood = items.some((i) => !isTicketLine(i.metadata));
        if (items.length > 0 && ((addingTicket && cartHasFood) || (!addingTicket && cartHasTickets))) {
          toast.error(
            addingTicket
              ? "Finish or clear your current order before buying event tickets — tickets are purchased separately."
              : "Your cart has event tickets. Tickets are purchased separately from food & menu items.",
          );
          return;
        }
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
            ...(metadata && { metadata }),
          };
          set({ items: [...items, newItem], updatedAt: Date.now() });
        }
      },
      removeItem: (id) => set(({ items }) => ({ items: items.filter((i) => i.id !== id) })),
      updateQuantity: (id, quantity) =>
        set(({ items }) => ({
          items: items.map((i) => (i.id === id ? { ...i, quantity, total: i.price * quantity } : i)),
        })),
      updateItemMetadata: (id, patch) =>
        set(({ items }) => ({
          items: items.map((i) =>
            i.id === id ? { ...i, metadata: { ...(i.metadata ?? {}), ...patch } } : i,
          ),
          updatedAt: Date.now(),
        })),
      clear: () => set({ items: [], requestUtensils: false, orderNotes: "" }),
      subtotal: () => get().items.reduce((s, i) => s + i.total, 0),
      isTicketOnly: () => {
        const items = get().items;
        return items.length > 0 && items.every((i) => isTicketLine(i.metadata));
      },
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
