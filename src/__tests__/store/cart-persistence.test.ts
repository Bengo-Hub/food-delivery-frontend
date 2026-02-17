import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "@/store/cart";

describe("useCartStore persistence", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
    localStorage.removeItem("ordering-cart-storage");
  });

  it("persists cart items to localStorage", () => {
    useCartStore.getState().addItem({ id: "item-1", name: "Latte", price: 350 });

    const raw = localStorage.getItem("ordering-cart-storage");
    expect(raw).toBeTruthy();

    const stored = JSON.parse(raw!);
    expect(stored.state.items).toHaveLength(1);
    expect(stored.state.items[0]).toMatchObject({ id: "item-1", name: "Latte" });
  });

  it("clears persisted state when cart is cleared", () => {
    useCartStore.getState().addItem({ id: "item-1", name: "Latte", price: 350 });
    useCartStore.getState().clear();

    const raw = localStorage.getItem("ordering-cart-storage");
    const stored = JSON.parse(raw!);
    expect(stored.state.items).toEqual([]);
  });

  it("restores cart from persisted storage on rehydration", () => {
    // Seed localStorage as if a previous session wrote it
    const persisted = {
      state: {
        items: [
          { id: "item-2", name: "Espresso", quantity: 1, price: 250, total: 250 },
        ],
      },
      version: 0,
    };
    localStorage.setItem("ordering-cart-storage", JSON.stringify(persisted));

    // Trigger rehydration
    useCartStore.persist.rehydrate();

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: "item-2", name: "Espresso", price: 250 });
  });
});
