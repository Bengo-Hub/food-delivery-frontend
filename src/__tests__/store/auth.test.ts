import { describe, it, expect, beforeEach, vi } from "vitest";
import { useAuthStore } from "@/store/auth";

// Mock all auth API calls
vi.mock("@/lib/auth/api", () => ({
  loginWithEmail: vi.fn(),
  logout: vi.fn(),
  fetchProfile: vi.fn(),
  refreshSession: vi.fn(),
  fetchOrderSummary: vi.fn().mockResolvedValue([]),
  beginGoogleOAuth: vi.fn(),
  completeGoogleOAuth: vi.fn(),
  updateProfile: vi.fn(),
  updatePreferences: vi.fn(),
  updateSecurity: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  loadAuthState: () => ({ session: null, user: null }),
  persistAuthState: vi.fn(),
}));

vi.mock("@/lib/api/base", () => ({
  attachAuthTokenGetter: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.setState({
      status: "idle",
      error: null,
      session: null,
      user: null,
      orders: [],
    });
  });

  it("starts in idle state with no user", () => {
    const state = useAuthStore.getState();
    expect(state.status).toBe("idle");
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
  });

  it("clears state on logout", async () => {
    useAuthStore.setState({
      status: "authenticated",
      user: { id: "u1", name: "Test" } as never,
      session: { accessToken: "tok", refreshToken: "ref" } as never,
    });

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.status).toBe("idle");
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.orders).toEqual([]);
  });

  it("initialize with no session stays idle", async () => {
    await useAuthStore.getState().initialize();
    expect(useAuthStore.getState().status).toBe("idle");
  });
});
