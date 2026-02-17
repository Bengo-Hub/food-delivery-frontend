import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

import { useLoyaltyAccount, useLoyaltyTransactions, useTierBenefits, loyaltyKeys } from "@/hooks/use-loyalty";
import { TestWrapper } from "../utils/test-wrapper";

describe("useLoyaltyAccount", () => {
  it("fetches loyalty account data", async () => {
    const { result } = renderHook(() => useLoyaltyAccount(), { wrapper: TestWrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.tier).toBe("silver");
    expect(result.current.data?.points).toBe(1250);
    expect(result.current.data?.lifetimePoints).toBe(3500);
  });
});

describe("useLoyaltyTransactions", () => {
  it("fetches transaction history", async () => {
    const { result } = renderHook(() => useLoyaltyTransactions(), { wrapper: TestWrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.transactions).toHaveLength(2);
    expect(result.current.data?.transactions[0].type).toBe("earn");
    expect(result.current.data?.transactions[1].type).toBe("redeem");
  });

  it("accepts optional params", async () => {
    const { result } = renderHook(() => useLoyaltyTransactions({ limit: 10, page: 1 }), {
      wrapper: TestWrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.total).toBe(2);
  });
});

describe("useTierBenefits", () => {
  it("fetches tier benefits", async () => {
    const { result } = renderHook(() => useTierBenefits(), { wrapper: TestWrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.tier).toBe("silver");
    expect(result.current.data?.benefits).toHaveLength(2);
  });
});

describe("loyaltyKeys", () => {
  it("all is ['loyalty']", () => {
    expect(loyaltyKeys.all).toEqual(["loyalty"]);
  });

  it("account extends all", () => {
    expect(loyaltyKeys.account()).toEqual(["loyalty", "account"]);
  });

  it("transactions includes filters", () => {
    expect(loyaltyKeys.transactions({ limit: 10 })).toEqual(["loyalty", "transactions", { limit: 10 }]);
  });

  it("tierBenefits extends all", () => {
    expect(loyaltyKeys.tierBenefits()).toEqual(["loyalty", "tier-benefits"]);
  });
});
