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
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    setOn401(() => void logout());
    return () => setOn401(null);
  }, [logout]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthSync />
        {children}
        {showDevtools ? (
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
        ) : null}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
