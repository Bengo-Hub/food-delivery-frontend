import { MapPinIcon, ShoppingCartIcon } from "lucide-react";

import { SiteShell } from "@/components/layout/site-shell";
import { MenuDiscovery } from "@/components/menu/menu-discovery";
import { Button } from "@/components/primitives/button";
import { brand } from "@/config/brand";

export default function MenuPage() {
  return (
    <SiteShell>
      <section className="border-b border-slate-200 bg-brand-muted/60 py-16 dark:border-slate-800 dark:bg-brand-dark/20">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-emphasis/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-emphasis">
              <ShoppingCartIcon className="size-3.5" aria-hidden /> Menu & Ordering
            </span>
            <h1 className="text-4xl font-semibold text-slate-900 dark:text-white md:text-5xl">
              Curated menus crafted for {brand.shortName} patrons.
            </h1>
            <p className="max-w-2xl text-base text-slate-600 dark:text-slate-300">
              Browse seasonal dishes, personalize dietary filters, and sync your cart across web, PWA, and mobile
              clients. Availability is managed in real time by cafe operations and the food-delivery backend
              services.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <a href="#menu-browser">Explore menu</a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="/contact">Talk to sales</a>
              </Button>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900/80">
            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
              <MapPinIcon className="size-5 text-brand-emphasis" aria-hidden />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Multi-outlet menus</p>
                <p>Pull tenant-aware pricing sourced from the backend order catalog service.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div id="menu-browser">
        <MenuDiscovery />
      </div>
    </SiteShell>
  );
}

