import "@/styles/globals.css";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { CSSProperties } from "react";

import { Toaster } from "@/components/ui/sonner";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";
import { AppProviders } from "@/providers/app-providers";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: {
    default: brand.metadata.defaultTitle,
    template: brand.metadata.template,
  },
  description: brand.description,
  applicationName: brand.metadata.applicationName,
  icons: {
    icon: brand.assets.logo,
    apple: brand.assets.logo,
  },
  authors: [{ name: brand.name }],
  manifest: "/api/manifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: brand.shortName,
  },
  formatDetection: {
    telephone: false,
  },
  keywords: [
    "online ordering",
    "food delivery",
    brand.shortName.toLowerCase(),
    "pwa",
    "real-time tracking",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: brand.palette.dark },
    { color: brand.palette.primary },
  ],
};

const brandCssVariables = {
  "--brand-primary": brand.cssVariables.primary,
  "--brand-emphasis": brand.cssVariables.emphasis,
  "--brand-contrast": brand.cssVariables.contrast,
  "--brand-muted": brand.cssVariables.muted,
  "--brand-surface": brand.cssVariables.surface,
  "--brand-dark": brand.cssVariables.dark,
} satisfies Record<string, string>;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        style={brandCssVariables as CSSProperties}
        className={cn(
          geistSans.variable,
          geistMono.variable,
          "font-sans antialiased min-h-[100dvh] overflow-x-hidden",
        )}
      >
        <AppProviders>
          {children}
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
