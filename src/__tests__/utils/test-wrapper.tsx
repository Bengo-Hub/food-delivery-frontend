import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { OrgSlugProvider } from "@/providers/org-slug-provider";

/**
 * Creates a fresh QueryClient configured for testing:
 * - Retries disabled (fail fast)
 * - gcTime 0 (no caching between tests)
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Test wrapper providing QueryClient and OrgSlug context.
 * Use with renderHook or render:
 *
 *   renderHook(() => useOrders(), { wrapper: TestWrapper })
 */
export function TestWrapper({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <OrgSlugProvider orgSlug="test-org">{children}</OrgSlugProvider>
    </QueryClientProvider>
  );
}
