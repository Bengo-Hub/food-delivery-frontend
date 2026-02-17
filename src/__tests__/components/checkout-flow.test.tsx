import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";

import CheckoutPage from "@/app/[orgSlug]/checkout/page";
import { OrgSlugProvider } from "@/providers/org-slug-provider";
import { useAuthStore } from "@/store/auth";
import { useCartStore } from "@/store/cart";
import { useDiningModeStore } from "@/store/dining-mode";
import { createTestQueryClient } from "../utils/test-wrapper";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
  usePathname: () => "/test-org/checkout",
  useParams: () => ({ orgSlug: "test-org" }),
}));

// Mock SiteShell to simplify rendering
vi.mock("@/components/layout/site-shell", () => ({
  SiteShell: ({ children }: { children: React.ReactNode }) => <div data-testid="site-shell">{children}</div>,
}));

// Mock toast
vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function renderCheckout() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <OrgSlugProvider orgSlug="test-org">
        <CheckoutPage />
      </OrgSlugProvider>
    </QueryClientProvider>,
  );
}

describe("CheckoutPage", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
    useDiningModeStore.getState().reset();
    useAuthStore.setState({ user: null, status: "idle" });
  });

  it("shows sign in message when unauthenticated", () => {
    useAuthStore.setState({ status: "idle", user: null });

    renderCheckout();

    expect(screen.getByText("Sign in to continue")).toBeInTheDocument();
    expect(screen.getByText(/You need to be signed in/)).toBeInTheDocument();
  });

  it("shows empty cart message when authenticated with no items", () => {
    useAuthStore.setState({
      status: "authenticated",
      user: { id: "u1", email: "test@test.com", name: "Test" } as never,
    });

    renderCheckout();

    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
    expect(screen.getByText(/Add some items before/)).toBeInTheDocument();
  });

  it("renders order summary with cart items", () => {
    useAuthStore.setState({
      status: "authenticated",
      user: { id: "u1", email: "test@test.com", name: "Test" } as never,
    });
    useCartStore.setState({
      items: [
        { id: "item-1", name: "Caramel Latte", quantity: 2, price: 450, total: 900 },
        { id: "item-2", name: "Caesar Salad", quantity: 1, price: 650, total: 650 },
      ],
    });

    renderCheckout();

    expect(screen.getByText("Caramel Latte")).toBeInTheDocument();
    expect(screen.getByText("Caesar Salad")).toBeInTheDocument();
    expect(screen.getByText("Order Summary")).toBeInTheDocument();
  });

  it("shows delivery fee of KES 150 for delivery orders under 2000", () => {
    useAuthStore.setState({
      status: "authenticated",
      user: { id: "u1", email: "test@test.com", name: "Test" } as never,
    });
    useCartStore.setState({
      items: [{ id: "item-1", name: "Latte", quantity: 1, price: 350, total: 350 }],
    });
    useDiningModeStore.setState({ mode: "delivery" });

    renderCheckout();

    expect(screen.getByText("KES 150")).toBeInTheDocument();
  });

  it("shows free delivery for pickup mode", () => {
    useAuthStore.setState({
      status: "authenticated",
      user: { id: "u1", email: "test@test.com", name: "Test" } as never,
    });
    useCartStore.setState({
      items: [{ id: "item-1", name: "Latte", quantity: 1, price: 350, total: 350 }],
    });
    useDiningModeStore.setState({ mode: "pickup" });

    renderCheckout();

    expect(screen.getByText("Free")).toBeInTheDocument();
  });

  it("toggles between M-Pesa and Cash on Delivery payment methods", async () => {
    const user = userEvent.setup();

    useAuthStore.setState({
      status: "authenticated",
      user: { id: "u1", email: "test@test.com", name: "Test" } as never,
    });
    useCartStore.setState({
      items: [{ id: "item-1", name: "Latte", quantity: 1, price: 350, total: 350 }],
    });

    renderCheckout();

    // M-Pesa is default — phone input should be visible
    expect(screen.getByPlaceholderText("0712345678")).toBeInTheDocument();

    // Click Cash on Delivery
    await user.click(screen.getByText("Cash on Delivery"));

    // Phone input should be hidden
    expect(screen.queryByPlaceholderText("0712345678")).not.toBeInTheDocument();

    // Click M-Pesa to switch back
    await user.click(screen.getByText("M-Pesa"));

    expect(screen.getByPlaceholderText("0712345678")).toBeInTheDocument();
  });
});
