import { SiteShell } from "@/components/layout/site-shell";

import { MenuDiscovery } from "@/components/catalog/catalog-discovery";
import { CatalogHero } from "@/components/catalog/catalog-hero";

type CatalogPageProps = {
  searchParams: Promise<{ category?: string; outlet?: string; search?: string; dietary?: string; item_id?: string; action?: string }>;
};

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams;
  return (
    <SiteShell>
      <CatalogHero />
      <div id="menu-browser">
        <MenuDiscovery
          initialCategory={params.category}
          initialOutlet={params.outlet}
          initialSearch={params.search}
          initialDietary={params.dietary?.split(",").filter(Boolean)}
          initialItemId={params.item_id}
          initialAction={params.action}
        />
      </div>
    </SiteShell>
  );
}
