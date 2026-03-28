"use client";

import { useEffect, useState, type PropsWithChildren } from "react";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";

import { useMe } from "@/hooks/use-me";
import { setOn401 } from "@/lib/api/base";
import { createQueryClient } from "@/lib/query-client";
import { useAuthStore } from "@/store/auth";

import type { QueryClient } from "@tanstack/react-query";

import { TenantBrandingProvider } from "./branding-provider";

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

  useEffect(() => {
    // On 401, only clear local session — do NOT redirect to SSO.
    // Public pages (landing, catalog) fire unauthenticated API calls and
    // must not trigger a full SSO redirect cycle.
    const clearSession = useAuthStore.getState().clearLocalSession;
    setOn401(() => {
      if (clearSession) clearSession();
    });
    return () => setOn401(null);
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TenantBrandingProvider>
          <AuthSync />
          {children}
          {showDevtools ? (
            <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
          ) : null}
        </TenantBrandingProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
