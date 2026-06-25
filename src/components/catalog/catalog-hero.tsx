"use client";

import Link from "next/link";
import { ArrowLeftRight, ClockIcon, MapPinIcon, ShoppingCartIcon, SparklesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useOrderingConfig } from "@/hooks/use-ordering-config";

/**
 * CatalogHero — the storefront catalog header, adapted per outlet vertical via
 * useOrderingConfig (copy + behavioural flags). A restaurant says "Order food",
 * a hardware shop says "Shop products", a services provider says "Book services".
 * The dietary highlight is only shown for food verticals. Thin client shell so the
 * catalog page (a server component) stays static-friendly.
 */
export function CatalogHero() {
  const { config, copy } = useOrderingConfig();

  const highlights = [
    { icon: MapPinIcon, title: `Multi-${copy.outletLabel.toLowerCase()} catalog`, desc: "Prices & availability per location" },
    { icon: ClockIcon, title: "Real-time availability", desc: "Updates as inventory changes" },
    { icon: ArrowLeftRight, title: "Sync across devices", desc: "Start on web, finish on mobile" },
    config.showDietaryFilters
      ? { icon: SparklesIcon, title: "Dietary filters", desc: "Vegan, gluten-free & more" }
      : { icon: SparklesIcon, title: `Browse ${copy.itemLabelPlural.toLowerCase()}`, desc: "Filter, search & compare" },
  ];

  return (
    <section className="border-b border-border bg-brand-surface/60 py-6 sm:py-10 md:py-16">
      <div className="mx-auto w-full max-w-6xl space-y-4 px-4 sm:space-y-6 md:space-y-10">
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-emphasis/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-emphasis">
            <ShoppingCartIcon className="size-3.5" aria-hidden /> {copy.brandSuffix}
          </span>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
            {copy.heroTitle}
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {copy.heroSubtitle}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" asChild className="min-h-[48px]">
              <a href="#menu-browser">Explore {copy.itemLabelPlural.toLowerCase()}</a>
            </Button>
            <Button variant="outline" size="lg" asChild className="min-h-[48px]">
              <Link href="/dashboard/customer">My Account</Link>
            </Button>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:pb-0 lg:grid-cols-4">
          {highlights.map((feat) => (
            <Card key={feat.title} className="flex min-w-[200px] shrink-0 items-start gap-3 rounded-xl border border-border bg-card p-3 shadow-sm sm:min-w-0 sm:p-4">
              <div className="rounded-lg bg-primary/10 p-1.5">
                <feat.icon className="size-4 text-primary" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground sm:text-sm">{feat.title}</p>
                <p className="text-[11px] leading-snug text-muted-foreground sm:text-xs">{feat.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
