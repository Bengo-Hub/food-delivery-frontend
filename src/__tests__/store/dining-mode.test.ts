import { describe, it, expect, beforeEach } from "vitest";
import { useDiningModeStore } from "@/store/dining-mode";
import type { LocationInfo } from "@/store/dining-mode";

const mockLocation: LocationInfo = {
  address: "123 Main St, Busia",
  latitude: -0.0607,
  longitude: 34.2855,
  plusCode: "6GXH+5R",
};

describe("useDiningModeStore", () => {
  beforeEach(() => {
    useDiningModeStore.getState().reset();
  });

  it("defaults to delivery mode", () => {
    const { mode } = useDiningModeStore.getState();
    expect(mode).toBe("delivery");
  });

  it("switches to pickup mode", () => {
    useDiningModeStore.getState().setMode("pickup");
    expect(useDiningModeStore.getState().mode).toBe("pickup");
  });

  it("switches back to delivery mode", () => {
    useDiningModeStore.getState().setMode("pickup");
    useDiningModeStore.getState().setMode("delivery");
    expect(useDiningModeStore.getState().mode).toBe("delivery");
  });

  it("sets delivery location", () => {
    useDiningModeStore.getState().setDeliveryLocation(mockLocation);
    const { deliveryLocation } = useDiningModeStore.getState();
    expect(deliveryLocation).toEqual(mockLocation);
  });

  it("sets pickup outlet and auto-switches to pickup mode", () => {
    useDiningModeStore.getState().setPickupOutlet("outlet-1", "Urban Loft Busia");

    const state = useDiningModeStore.getState();
    expect(state.pickupOutletId).toBe("outlet-1");
    expect(state.pickupOutletName).toBe("Urban Loft Busia");
    expect(state.mode).toBe("pickup");
  });

  it("clears pickup outlet without changing mode", () => {
    useDiningModeStore.getState().setPickupOutlet("outlet-1", "Urban Loft Busia");
    useDiningModeStore.getState().clearPickupOutlet();

    const state = useDiningModeStore.getState();
    expect(state.pickupOutletId).toBeNull();
    expect(state.pickupOutletName).toBeNull();
    expect(state.mode).toBe("pickup"); // mode unchanged
  });

  it("sets scheduled time and marks isScheduled", () => {
    const scheduledTime = { date: new Date("2026-02-20T14:30:00Z"), label: "Today, 2:30 PM" };
    useDiningModeStore.getState().setScheduledTime(scheduledTime);

    const state = useDiningModeStore.getState();
    expect(state.scheduledTime).toEqual(scheduledTime);
    expect(state.isScheduled).toBe(true);
  });

  it("clears schedule", () => {
    const scheduledTime = { date: new Date("2026-02-20T14:30:00Z"), label: "Today, 2:30 PM" };
    useDiningModeStore.getState().setScheduledTime(scheduledTime);
    useDiningModeStore.getState().clearSchedule();

    const state = useDiningModeStore.getState();
    expect(state.scheduledTime).toBeNull();
    expect(state.isScheduled).toBe(false);
  });

  it("resets to initial state", () => {
    useDiningModeStore.getState().setMode("pickup");
    useDiningModeStore.getState().setDeliveryLocation(mockLocation);
    useDiningModeStore.getState().setPickupOutlet("outlet-1", "Urban Loft");
    useDiningModeStore.getState().setScheduledTime({ date: new Date(), label: "Now" });

    useDiningModeStore.getState().reset();

    const state = useDiningModeStore.getState();
    expect(state.mode).toBe("delivery");
    expect(state.deliveryLocation).toBeNull();
    expect(state.pickupOutletId).toBeNull();
    expect(state.pickupOutletName).toBeNull();
    expect(state.isScheduled).toBe(false);
    expect(state.scheduledTime).toBeNull();
  });

  it("persist partialize only includes mode, deliveryLocation, pickupOutletId, pickupOutletName", () => {
    useDiningModeStore.getState().setMode("pickup");
    useDiningModeStore.getState().setDeliveryLocation(mockLocation);
    useDiningModeStore.getState().setPickupOutlet("outlet-1", "Urban Loft");
    useDiningModeStore.getState().setScheduledTime({ date: new Date(), label: "Now" });

    const stored = JSON.parse(localStorage.getItem("dining-mode-storage") ?? "{}");
    const persisted = stored.state;

    expect(persisted).toHaveProperty("mode");
    expect(persisted).toHaveProperty("deliveryLocation");
    expect(persisted).toHaveProperty("pickupOutletId");
    expect(persisted).toHaveProperty("pickupOutletName");
    // Scheduling fields should NOT be persisted
    expect(persisted).not.toHaveProperty("isScheduled");
    expect(persisted).not.toHaveProperty("scheduledTime");
  });
});
