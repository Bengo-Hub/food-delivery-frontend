"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { MenuIcon } from "lucide-react";

import { Button } from "@/components/primitives/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/menu", label: "Menu" },
  { href: "/delivery", label: "Delivery" },
  { href: "/cafes", label: "Cafés" },
  { href: "/loyalty", label: "Loyalty" },
];

export function SiteHeader(): JSX.Element {
  const pathname = usePathname();

  const activeHref = useMemo(() => pathname ?? "/", [pathname]);

  return (
    <header className="sticky top-0 z-40 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <span className="h-8 w-8 rounded-full bg-brand-emphasis" aria-hidden />
          <span>BengoBox Urban Café</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "transition-colors hover:text-brand-emphasis",
                activeHref.startsWith(link.href)
                  ? "text-brand-emphasis"
                  : "text-slate-600 dark:text-slate-300",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" size="sm" aria-label="Toggle language">
            EN / SW
          </Button>
          <Button size="sm" asChild>
            <Link href="/auth/sign-in">Sign in</Link>
          </Button>
        </div>
        <button
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-full border border-slate-200 md:hidden"
          aria-label="Open navigation"
        >
          <MenuIcon className="size-5" />
        </button>
      </div>
    </header>
  );
}
