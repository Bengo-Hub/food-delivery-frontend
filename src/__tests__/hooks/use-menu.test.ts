import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

import { useMenuItems, useMenuItem, useFeaturedItems, useCategories, useOutlets, menuKeys, outletKeys } from "@/hooks/use-menu";
import { TestWrapper } from "../utils/test-wrapper";
import { mockData } from "../mocks/handlers";

describe("useMenuItems", () => {
  it("returns paginated menu items", async () => {
    const { result } = renderHook(() => useMenuItems(), { wrapper: TestWrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toHaveLength(2);
    expect(result.current.data?.data[0].name).toBe("Caramel Latte");
    expect(result.current.data?.meta.total).toBe(2);
  });

  it("keeps previous data on refetch (placeholderData)", async () => {
    const { result, rerender } = renderHook(
      ({ filters }) => useMenuItems(filters),
      { wrapper: TestWrapper, initialProps: { filters: undefined as undefined } },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(2);

    // Re-render with new filters — placeholderData should keep data visible
    rerender({ filters: { category: "salads" } as never });
    expect(result.current.data).toBeDefined();
  });
});

describe("useMenuItem", () => {
  it("fetches single item by id", async () => {
    const { result } = renderHook(() => useMenuItem("item-1"), { wrapper: TestWrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.id).toBe("item-1");
    expect(result.current.data?.name).toBe("Caramel Latte");
  });

  it("is disabled when id is empty", () => {
    const { result } = renderHook(() => useMenuItem(""), { wrapper: TestWrapper });

    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useFeaturedItems", () => {
  it("returns featured items array", async () => {
    const { result } = renderHook(() => useFeaturedItems(), { wrapper: TestWrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // fetchFeaturedItems extracts .data from the paginated response
    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data).toHaveLength(2);
  });
});

describe("useCategories", () => {
  it("returns category list", async () => {
    const { result } = renderHook(() => useCategories(), { wrapper: TestWrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(3);
    expect(result.current.data?.[0].name).toBe("Hot Beverages");
  });
});

describe("useOutlets", () => {
  it("returns paginated outlets", async () => {
    const { result } = renderHook(() => useOutlets(), { wrapper: TestWrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toHaveLength(1);
    expect(result.current.data?.data[0].name).toBe("Urban Loft Busia");
  });
});

describe("query key factories", () => {
  it("menuKeys.all is ['menu']", () => {
    expect(menuKeys.all).toEqual(["menu"]);
  });

  it("menuKeys.items() extends all", () => {
    expect(menuKeys.items()).toEqual(["menu", "items"]);
  });

  it("menuKeys.itemList with filters includes filter object", () => {
    const filters = { category: "hot-beverages" };
    expect(menuKeys.itemList(filters)).toEqual(["menu", "items", filters]);
  });

  it("outletKeys.list with filters includes filter object", () => {
    const filters = { search: "urban" };
    expect(outletKeys.list(filters)).toEqual(["outlets", "list", filters]);
  });
});
