"use client";

import { useState, type PropsWithChildren } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";

import { createQueryClient } from "@/lib/query-client";

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState<QueryClient>(() => createQueryClient());
  const showDevtools = process.env.NODE_ENV !== "production";

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        {children}
        {showDevtools ? <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" /> : null}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
