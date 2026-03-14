import { Heart } from "lucide-react";

import { SiteShell } from "@/components/layout/site-shell";
import { MenuDiscovery } from "@/components/menu/menu-discovery";

type FavoritesPageProps = {
  searchParams: Promise<{ category?: string; search?: string }>;
};

export default async function FavoritesPage({ searchParams }: FavoritesPageProps) {
  const params = await searchParams;
  
  return (
    <SiteShell>
      <section className="border-b border-border bg-brand-surface/60 py-6 sm:py-10 md:py-16">
        <div className="mx-auto w-full max-w-6xl space-y-4 px-4 sm:space-y-6 md:space-y-10">
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-600">
              <Heart className="size-3.5 fill-current" aria-hidden /> Favorites & Whitelist
            </span>
            <h1 className="text-2xl font-semibold text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
              Your Favorite Items
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Quickly access the items you love most. Browse your curated list and add them to your cart in one click.
            </p>
          </div>
        </div>
      </section>
      
      <div id="favorites-browser">
        <MenuDiscovery
          initialCategory={params.category}
          initialSearch={params.search}
          initialAction="whitelist"
        />
      </div>
    </SiteShell>
  );
}
