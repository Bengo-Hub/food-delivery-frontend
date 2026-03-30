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
    // On 401 from backend API calls, only clear local session if the user
    // is fully authenticated. During 'syncing'/'loading' states, backend
    // calls may 401 because JIT sync hasn't completed — do NOT clear session.
    setOn401(() => {
      const state = useAuthStore.getState();
      if (state.status === "syncing" || state.status === "loading") return;
      if (state.clearLocalSession) state.clearLocalSession();
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
