import { create } from "zustand";

type UserRole = "rider" | "merchant" | "staff" | "admin";

type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  jwt: string;
};

type AuthState = {
  user: User | null;
  loginWithEmail: (input: { email: string; password: string; role: UserRole }) => Promise<void>;
  loginWithGoogle: (role: UserRole) => Promise<void>;
  logout: () => void;
};

const issueDemoJwt = (payload: Record<string, unknown>): string => {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.`;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loginWithEmail: async ({ email, password, role }) => {
    // Simulate validation
    await new Promise((resolve) => setTimeout(resolve, 300));
    const user: User = {
      id: crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2),
      name: email.split("@")[0] ?? "User",
      email,
      role,
      jwt: issueDemoJwt({ sub: email, role }),
    };
    localStorage.setItem("demo_user", JSON.stringify(user));
    set({ user });
  },
  loginWithGoogle: async (role) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const user: User = {
      id: crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2),
      name: "Google User",
      email: "google-user@example.com",
      role,
      jwt: issueDemoJwt({ sub: "google-user@example.com", role, provider: "google" }),
    };
    localStorage.setItem("demo_user", JSON.stringify(user));
    set({ user });
  },
  logout: () => {
    localStorage.removeItem("demo_user");
    set({ user: null });
  },
}));
