import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

import { useCatalogItems, useCatalogItem, useFeaturedItems, useCategories, useOutlets, catalogKeys, outletKeys } from "@/hooks/use-catalog";
import { TestWrapper } from "../utils/test-wrapper";
import { mockData } from "../mocks/handlers";

const tenantSlug = "urban-loft";

describe("useCatalogItems", () => {
  it("returns paginated menu items", async () => {
    const { result } = renderHook(() => useCatalogItems(tenantSlug), { wrapper: TestWrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toHaveLength(2);
    expect(result.current.data?.data[0].name).toBe("Caramel Latte");
    expect(result.current.data?.meta.total).toBe(2);
  });

  it("keeps previous data on refetch (placeholderData)", async () => {
    const { result, rerender } = renderHook(
      ({ filters }) => useCatalogItems(tenantSlug, filters),
      { wrapper: TestWrapper, initialProps: { filters: undefined as undefined } },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(2);

    rerender({ filters: { category: "salads" } as never });
    expect(result.current.data).toBeDefined();
  });
});

describe("useCatalogItem", () => {
  it("fetches single item by id", async () => {
    const { result } = renderHook(() => useCatalogItem(tenantSlug, "item-1"), { wrapper: TestWrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.id).toBe("item-1");
    expect(result.current.data?.name).toBe("Caramel Latte");
  });

  it("is disabled when id is empty", () => {
    const { result } = renderHook(() => useCatalogItem(tenantSlug, ""), { wrapper: TestWrapper });

    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useFeaturedItems", () => {
  it("returns featured items array", async () => {
    const { result } = renderHook(() => useFeaturedItems(tenantSlug), { wrapper: TestWrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data).toHaveLength(2);
  });
});

describe("useCategories", () => {
  it("returns category list", async () => {
    const { result } = renderHook(() => useCategories(tenantSlug), { wrapper: TestWrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(3);
    expect(result.current.data?.[0].name).toBe("Hot Beverages");
  });
});

describe("useOutlets", () => {
  it("returns paginated outlets", async () => {
    const { result } = renderHook(() => useOutlets(tenantSlug), { wrapper: TestWrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toHaveLength(1);
    expect(result.current.data?.data[0].name).toBe("Urban Loft Busia");
  });
});

describe("query key factories", () => {
  it("catalogKeys.all is ['catalog']", () => {
    expect(catalogKeys.all).toEqual(["catalog"]);
  });

  it("catalogKeys.items() extends all", () => {
    expect(catalogKeys.items()).toEqual(["catalog", "items"]);
  });

  it("catalogKeys.itemList with filters includes filter object", () => {
    const filters = { category: "hot-beverages" };
    expect(catalogKeys.itemList(filters)).toEqual(["catalog", "items", filters]);
  });

  it("outletKeys.list with filters includes filter object", () => {
    const filters = { search: "urban" };
    expect(outletKeys.list(filters)).toEqual(["outlets", "list", filters]);
  });
});
