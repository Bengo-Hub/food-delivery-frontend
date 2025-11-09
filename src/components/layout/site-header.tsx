"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { MenuIcon, XIcon } from "lucide-react";

import { Button } from "@/components/primitives/button";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

const links = [
  { href: "/menu", label: "Menu" },
  { href: "/delivery", label: "Delivery" },
  { href: "/riders", label: "Riders" },
  { href: "/merchants", label: "Merchants" },
  { href: "/cafes", label: "Cafés" },
  { href: "/loyalty", label: "Loyalty" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeHref = useMemo(() => pathname ?? "/", [pathname]);

  useEffect(() => {
    // Close drawer on route change
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <span className="relative flex items-center">
            <Image
              src={brand.assets.logo}
              alt={`${brand.name} logo`}
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover"
              priority
            />
          </span>
          <span>{brand.name}</span>
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
          <Button variant="ghost" size="sm" asChild>
            <Link href="/riders/signup">Become a rider</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/merchants/signup">Launch merchant</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/auth">Sign in</Link>
          </Button>
        </div>
        <button
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-full border border-slate-200 md:hidden"
          aria-label="Open navigation"
          onClick={() => setMobileOpen(true)}
        >
          <MenuIcon className="size-5" />
        </button>
      </div>
      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 right-0 w-80 max-w-full overflow-y-auto border-l border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-4 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
                <Image
                  src={brand.assets.logo}
                  alt={`${brand.name} logo`}
                  width={28}
                  height={28}
                  className="h-7 w-7 rounded-full object-cover"
                />
                <span>{brand.shortName}</span>
              </Link>
              <button
                type="button"
                className="inline-flex size-9 items-center justify-center rounded-full border border-slate-200"
                aria-label="Close navigation"
                onClick={() => setMobileOpen(false)}
              >
                <XIcon className="size-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-3">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm transition-colors hover:bg-brand-muted hover:text-brand-emphasis",
                    activeHref.startsWith(link.href)
                      ? "bg-brand-muted text-brand-emphasis"
                      : "text-slate-700 dark:text-slate-300",
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-6 flex flex-col gap-2">
              <Button variant="ghost" asChild>
                <Link href="/riders/signup">Become a rider</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/merchants/signup">Launch merchant</Link>
              </Button>
              <Button asChild>
                <Link href="/auth">Sign in</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
