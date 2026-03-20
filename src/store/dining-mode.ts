import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DiningMode = "delivery" | "pickup";

export interface LocationInfo {
  address: string;
  latitude: number;
  longitude: number;
  plusCode?: string;
}

export interface ScheduledTime {
  date: Date;
  label: string; // e.g., "Today, 2:30 PM"
}

/** Use cases where pickup makes sense */
const PICKUP_USE_CASES = new Set(["hospitality", "food_delivery", "quick_service"]);

function getSupportedModes(tenantUseCase: string): DiningMode[] {
  return PICKUP_USE_CASES.has(tenantUseCase) ? ["delivery", "pickup"] : ["delivery"];
}

interface DiningModeState {
  // Current dining mode
  mode: DiningMode;

  // Tenant use-case awareness
  tenantUseCase: string;
  supportedModes: DiningMode[];

  // Delivery location
  deliveryLocation: LocationInfo | null;

  // Pickup location (selected outlet)
  pickupOutletId: string | null;
  pickupOutletName: string | null;

  // Scheduling
  isScheduled: boolean;
  scheduledTime: ScheduledTime | null;

  // Actions
  setMode: (mode: DiningMode) => void;
  setTenantUseCase: (useCase: string) => void;
  setDeliveryLocation: (location: LocationInfo) => void;
  setPickupOutlet: (outletId: string, outletName: string) => void;
  clearPickupOutlet: () => void;
  setScheduledTime: (time: ScheduledTime | null) => void;
  setIsScheduled: (scheduled: boolean) => void;
  clearSchedule: () => void;
  reset: () => void;
}

const initialState = {
  mode: "delivery" as DiningMode,
  tenantUseCase: "hospitality",
  supportedModes: ["delivery", "pickup"] as DiningMode[],
  deliveryLocation: null,
  pickupOutletId: null,
  pickupOutletName: null,
  isScheduled: false,
  scheduledTime: null,
};

export const useDiningModeStore = create<DiningModeState>()(
  persist(
    (set) => ({
      ...initialState,

      setMode: (mode) =>
        set((state) => {
          if (!state.supportedModes.includes(mode)) return {};
          return { mode };
        }),

      setTenantUseCase: (useCase) =>
        set((state) => {
          const supported = getSupportedModes(useCase);
          const newMode = supported.includes(state.mode) ? state.mode : supported[0];
          return { tenantUseCase: useCase, supportedModes: supported, mode: newMode };
        }),

      setDeliveryLocation: (location) => set({ deliveryLocation: location }),

      setPickupOutlet: (outletId, outletName) =>
        set((state) => ({
          pickupOutletId: outletId,
          pickupOutletName: outletName,
          mode: state.supportedModes.includes("pickup") ? "pickup" : state.mode,
        })),

      clearPickupOutlet: () => set({ pickupOutletId: null, pickupOutletName: null }),

      setScheduledTime: (time) =>
        set({
          scheduledTime: time,
          isScheduled: time !== null,
        }),

      setIsScheduled: (scheduled) => set({ isScheduled: scheduled }),

      clearSchedule: () => set({ scheduledTime: null, isScheduled: false }),

      reset: () => set(initialState),
    }),
    {
      name: "dining-mode-storage",
      partialize: (state) => ({
        mode: state.mode,
        tenantUseCase: state.tenantUseCase,
        supportedModes: state.supportedModes,
        deliveryLocation: state.deliveryLocation,
        pickupOutletId: state.pickupOutletId,
        pickupOutletName: state.pickupOutletName,
      }),
    },
  ),
);

// Selector hooks for common patterns
export const useCurrentDiningMode = () => useDiningModeStore((state) => state.mode);
export const useIsDeliveryMode = () => useDiningModeStore((state) => state.mode === "delivery");
export const useIsPickupMode = () => useDiningModeStore((state) => state.mode === "pickup");
export const useSupportedModes = () => useDiningModeStore((state) => state.supportedModes);
