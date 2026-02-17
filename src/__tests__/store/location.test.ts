import { describe, it, expect, beforeEach } from "vitest";
import {
  useCustomerLocationStore,
  getActiveLocation,
  getActiveLabel,
} from "@/store/location";

describe("useCustomerLocationStore", () => {
  beforeEach(() => {
    useCustomerLocationStore.setState({
      defaultLocation: [-0.0607, 34.2855],
      defaultLabel: "Busia Township",
      customLocation: null,
      customLabel: null,
    });
  });

  it("defaults to Busia Township", () => {
    const state = useCustomerLocationStore.getState();
    expect(state.defaultLocation).toEqual([-0.0607, 34.2855]);
    expect(state.defaultLabel).toBe("Busia Township");
  });

  it("sets custom location overriding active location", () => {
    useCustomerLocationStore.getState().setCustomLocation([1.0, 36.0], "Nairobi");

    const state = useCustomerLocationStore.getState();
    expect(getActiveLocation(state)).toEqual([1.0, 36.0]);
    expect(getActiveLabel(state)).toBe("Nairobi");
  });

  it("falls back to default when custom location is cleared", () => {
    useCustomerLocationStore.getState().setCustomLocation([1.0, 36.0], "Nairobi");
    useCustomerLocationStore.getState().clearCustomLocation();

    const state = useCustomerLocationStore.getState();
    expect(getActiveLocation(state)).toEqual([-0.0607, 34.2855]);
    expect(getActiveLabel(state)).toBe("Busia Township");
  });

  it("updates default location", () => {
    useCustomerLocationStore.getState().setDefaultLocation([0.3136, 32.5811], "Jinja");

    const state = useCustomerLocationStore.getState();
    expect(state.defaultLocation).toEqual([0.3136, 32.5811]);
    expect(state.defaultLabel).toBe("Jinja");
    expect(getActiveLocation(state)).toEqual([0.3136, 32.5811]);
  });

  it("uses default label when custom location set without label", () => {
    useCustomerLocationStore.getState().setCustomLocation([1.0, 36.0]);

    const state = useCustomerLocationStore.getState();
    expect(getActiveLabel(state)).toBe("Busia Township");
  });
});
