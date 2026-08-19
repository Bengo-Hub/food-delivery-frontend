"use client";

import { useEffect, useState, type PropsWithChildren } from "react";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";

import { useMe } from "@/hooks/use-me";
import { attachOutletIdGetter, setOn401 } from "@/lib/api/base";
import { createQueryClient } from "@/lib/query-client";
import { useAuthStore } from "@/store/auth";
import { useOutletFilterStore } from "@/store/outlet-filter";

import type { QueryClient } from "@tanstack/react-query";

import { SubscriptionEntitlementsProvider } from "./subscription-entitlements-provider";
import { PWAUpdateBanner } from "@/components/pwa/pwa-update-banner";
import { OfflineBar } from "@bengo-hub/shared-ui-lib/offline";

/** Syncs GET /auth/me (useMe) result into auth store so roles/permissions stay current. */
function AuthSync() {
  const session = useAuthStore((s) => s.session);
  const syncFromProfile = useAuthStore((s) => s.syncFromProfile);
  const { data } = useMe(!!session?.accessToken);

  useEffect(() => {
    if (data) syncFromProfile(data);
  }, [data, syncFromProfile]);

  return null;
}

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState<QueryClient>(() => createQueryClient());
  const showDevtools = process.env.NODE_ENV !== "production";
  const initializeAuth = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Attach outlet ID getter so the API interceptor always sends X-Outlet-ID
  // when a staff/admin user has a selected outlet in the store.
  useEffect(() => {
    attachOutletIdGetter(() => useOutletFilterStore.getState().outletIdHeader());
  }, []);

  // Rehydrate outlet from localStorage on mount (for page refreshes)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('ordering-selected-outlet-id');
    if (stored && !useOutletFilterStore.getState().selectedOutlet) {
      useOutletFilterStore.getState().selectOutlet({
        id: stored,
        code: '',
        name: '',
      });
    }
  }, []);

  useEffect(() => {
    // On 401 from backend API calls, only fire after token refresh has failed
    // (handled in base.ts interceptor). Skip during syncing/loading (JIT sync)
    // and within 15s of authentication (token propagation grace period).
    setOn401(() => {
      const { status, lastAuthenticatedAt } = useAuthStore.getState();
      if (status === "syncing" || status === "loading") return;
      if (lastAuthenticatedAt && Date.now() - lastAuthenticatedAt < 15_000) return;
      queryClient.clear();
      void useAuthStore.getState().logout();
    });
    return () => setOn401(null);
  }, [queryClient]);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <SubscriptionEntitlementsProvider>
          <PWAUpdateBanner />
          <OfflineBar
            availableOffline={["Browse cached menu", "View past orders"]}
            disabledOffline={["Placing orders", "Payments", "Live tracking"]}
          />
          <AuthSync />
          {children}
          {showDevtools ? (
            <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
          ) : null}
        </SubscriptionEntitlementsProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
