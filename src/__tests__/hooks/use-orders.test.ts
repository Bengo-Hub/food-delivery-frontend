import { describe, it, expect } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

import {
  useOrders,
  useOrder,
  useOrderTracking,
  usePaymentStatus,
  useCreateOrder,
  useCancelOrder,
  useApplyPromoCode,
  orderKeys,
} from "@/hooks/use-orders";
import { TestWrapper, createTestQueryClient } from "../utils/test-wrapper";
import { QueryClientProvider } from "@tanstack/react-query";
import { OrgSlugProvider } from "@/providers/org-slug-provider";
import type { ReactNode } from "react";

describe("useOrders", () => {
  it("fetches order list", async () => {
    const { result } = renderHook(() => useOrders(), { wrapper: TestWrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.orders).toHaveLength(1);
    expect(result.current.data?.orders[0].orderNumber).toBe("ULC-001");
    expect(result.current.data?.total).toBe(1);
  });
});

describe("useOrder", () => {
  it("fetches single order by id", async () => {
    const { result } = renderHook(() => useOrder("order-1"), { wrapper: TestWrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.id).toBe("order-1");
    expect(result.current.data?.status).toBe("confirmed");
    expect(result.current.data?.grandTotal).toBe(1050);
  });

  it("is disabled when orderId is empty", () => {
    const { result } = renderHook(() => useOrder(""), { wrapper: TestWrapper });

    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useOrderTracking", () => {
  it("fetches tracking data", async () => {
    const { result } = renderHook(() => useOrderTracking("order-1"), { wrapper: TestWrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.status).toBe("en_route");
    expect(result.current.data?.riderName).toBe("John");
    expect(result.current.data?.eta).toBe("15 min");
  });

  it("is disabled when enabled=false", () => {
    const { result } = renderHook(() => useOrderTracking("order-1", false), { wrapper: TestWrapper });

    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("usePaymentStatus", () => {
  it("fetches payment intent status", async () => {
    const { result } = renderHook(() => usePaymentStatus("pi-1"), { wrapper: TestWrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.id).toBe("pi-1");
    expect(result.current.data?.status).toBe("completed");
    expect(result.current.data?.amount).toBe(1050);
  });

  it("is disabled when enabled=false", () => {
    const { result } = renderHook(() => usePaymentStatus("pi-1", false), { wrapper: TestWrapper });

    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useCreateOrder", () => {
  it("creates order and returns data", async () => {
    const { result } = renderHook(() => useCreateOrder(), { wrapper: TestWrapper });

    await act(async () => {
      result.current.mutate({
        outletId: "outlet-1",
        items: [{ menuItemId: "item-1", name: "Caramel Latte", quantity: 2, unitPrice: 450, totalPrice: 900 }],
        deliveryAddress: "123 Main St",
        paymentMethod: "mpesa",
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.outletId).toBe("outlet-1");
  });
});

describe("useCancelOrder", () => {
  it("cancels an order", async () => {
    const { result } = renderHook(() => useCancelOrder(), { wrapper: TestWrapper });

    await act(async () => {
      result.current.mutate({ orderId: "order-1", reason: "Changed my mind" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe("useApplyPromoCode", () => {
  it("validates promo code and returns discount", async () => {
    const { result } = renderHook(() => useApplyPromoCode(), { wrapper: TestWrapper });

    await act(async () => {
      result.current.mutate({ code: "SAVE10", subtotal: 1000 });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.valid).toBe(true);
    expect(result.current.data?.discount).toBe(100);
    expect(result.current.data?.message).toBe("10% off applied!");
  });
});

describe("orderKeys", () => {
  it("all is ['orders']", () => {
    expect(orderKeys.all).toEqual(["orders"]);
  });

  it("detail includes id", () => {
    expect(orderKeys.detail("order-1")).toEqual(["orders", "detail", "order-1"]);
  });

  it("tracking includes id", () => {
    expect(orderKeys.tracking("order-1")).toEqual(["orders", "tracking", "order-1"]);
  });

  it("payment includes id", () => {
    expect(orderKeys.payment("pi-1")).toEqual(["orders", "payment", "pi-1"]);
  });
});
