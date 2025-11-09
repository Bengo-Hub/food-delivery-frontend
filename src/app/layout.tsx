import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display as PlayfairDisplay } from "next/font/google";
import "@/styles/globals.css";

import { AppProviders } from "@/providers/app-providers";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const display = PlayfairDisplay({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: {
    default: "BengoBox Food Delivery",
    template: "%s | BengoBox Food Delivery",
  },
  description:
    "Unified urban cafe ordering experience with localized content, offline resilience, and realtime delivery visibility.",
  applicationName: "BengoBox Food Delivery",
  authors: [{ name: "BengoBox" }],
  keywords: [
    "food delivery",
    "bengobox",
    "next.js",
    "react",
    "pwa",
    "tanstack query",
  ],
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#0f172a" }, { color: "#6b2a1b" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.variable, display.variable, "font-sans antialiased")}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
