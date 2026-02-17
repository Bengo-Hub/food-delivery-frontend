import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "@/store/cart";

describe("useCartStore", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
  });

  it("starts with empty cart", () => {
    const { items } = useCartStore.getState();
    expect(items).toEqual([]);
  });

  it("adds an item to cart", () => {
    useCartStore.getState().addItem({
      id: "item-1",
      name: "Latte",
      price: 350,
      outletId: "outlet-1",
      outletName: "Urban Loft",
    });

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "item-1",
      name: "Latte",
      price: 350,
      quantity: 1,
      total: 350,
    });
  });

  it("increments quantity when adding existing item", () => {
    const store = useCartStore.getState();
    store.addItem({ id: "item-1", name: "Latte", price: 350 });
    store.addItem({ id: "item-1", name: "Latte", price: 350 });

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
    expect(items[0].total).toBe(700);
  });

  it("removes an item from cart", () => {
    const store = useCartStore.getState();
    store.addItem({ id: "item-1", name: "Latte", price: 350 });
    store.addItem({ id: "item-2", name: "Espresso", price: 250 });
    store.removeItem("item-1");

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("item-2");
  });

  it("updates item quantity", () => {
    const store = useCartStore.getState();
    store.addItem({ id: "item-1", name: "Latte", price: 350 });
    store.updateQuantity("item-1", 3);

    const { items } = useCartStore.getState();
    expect(items[0].quantity).toBe(3);
    expect(items[0].total).toBe(1050);
  });

  it("clears all items", () => {
    const store = useCartStore.getState();
    store.addItem({ id: "item-1", name: "Latte", price: 350 });
    store.addItem({ id: "item-2", name: "Espresso", price: 250 });
    store.clear();

    const { items } = useCartStore.getState();
    expect(items).toEqual([]);
  });

  it("calculates subtotal correctly", () => {
    const store = useCartStore.getState();
    store.addItem({ id: "item-1", name: "Latte", price: 350, quantity: 2 });
    store.addItem({ id: "item-2", name: "Espresso", price: 250 });

    const subtotal = useCartStore.getState().subtotal();
    expect(subtotal).toBe(950); // 350*2 + 250
  });
});
