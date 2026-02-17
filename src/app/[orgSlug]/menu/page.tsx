import Link from "next/link";

import {
  ArrowLeftRight,
  ClockIcon,
  MapPinIcon,
  ShoppingCartIcon,
  SparklesIcon,
} from "lucide-react";

import { SiteShell } from "@/components/layout/site-shell";
import { CustomerLocationPicker } from "@/components/location/customer-location-picker";
import { MenuDiscovery } from "@/components/menu/menu-discovery";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function MenuPage() {
  return (
    <SiteShell>
      <section className="border-b border-border bg-brand-surface/60 py-8 sm:py-12 md:py-16">
        <div className="mx-auto w-full max-w-6xl space-y-6 px-4 sm:space-y-8 md:space-y-10">
          {/* Text Content Section */}
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-emphasis/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-emphasis">
              <ShoppingCartIcon className="size-3.5" aria-hidden /> Menu & Ordering
            </span>
            <h1 className="text-2xl font-semibold text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
              Browse & Order
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Browse seasonal dishes, personalize dietary filters, and sync your cart across web,
              PWA, and mobile clients. Availability is managed in real time by operations and
              backend services.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <a href="#menu-browser">Explore menu</a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/dashboard/customer">My Account</Link>
              </Button>
            </div>
          </div>

          {/* Delivery Location Section - Mobile-first: Stack on mobile, side-by-side on desktop */}
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_1fr]">
            <CustomerLocationPicker />
            <div className="flex flex-col gap-3 sm:gap-4">
              <Card className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:rounded-3xl sm:p-6">
                <div className="flex items-start gap-2 text-sm text-muted-foreground sm:gap-3">
                  <MapPinIcon
                    className="mt-0.5 size-4 shrink-0 text-primary sm:size-5"
                    aria-hidden
                  />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-foreground sm:text-sm">
                      Multi-outlet menus
                    </p>
                    <p className="text-xs leading-relaxed sm:text-sm">
                      Tenant-aware pricing and availability across multiple locations.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Additional Feature Cards */}
              <div className="space-y-4">
                <Card className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-primary/10 p-1.5">
                      <ClockIcon className="size-4 text-primary" aria-hidden />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        Real-time availability
                      </p>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        Menu items update instantly as inventory changes. No surprises at checkout.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-primary/10 p-1.5">
                      <ArrowLeftRight className="size-4 text-primary" aria-hidden />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-semibold text-foreground">Sync across devices</p>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        Your cart follows you. Start on web, finish on mobile—seamlessly.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-primary/10 p-1.5">
                      <SparklesIcon className="size-4 text-primary" aria-hidden />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-semibold text-foreground">Dietary filters</p>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        Filter by vegan, gluten-free, spicy, and more. Find what fits your needs.
                      </p>
                    </div>
                  </div>
                </Card>
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
