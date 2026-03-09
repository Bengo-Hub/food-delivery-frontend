"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ChefHatIcon,
  FilterIcon,
  SearchIcon,
  ShoppingCart as ShoppingCartIcon,
  SproutIcon,
  WheatIcon,
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCategories, useMenuItems, useOutlets } from "@/hooks/use-menu";
import { cn } from "@/lib/utils";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useCartStore } from "@/store/cart";
import type { DietaryTag } from "@/types/menu";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: string;
  priceValue: number;
  category: string;
  categoryId: string;
  dietary: DietaryTag[];
  feature?: "recommended" | "new";
  image?: string;
  outletId?: string;
  outletName?: string;
};

const dietaryFilterOpts: Array<{ value: DietaryTag; label: string; icon: React.ReactNode }> = [
  { value: "vegan", label: "Vegan", icon: <SproutIcon className="size-4" aria-hidden /> },
  { value: "vegetarian", label: "Vegetarian", icon: <SproutIcon className="size-4" aria-hidden /> },
  { value: "glutenFree", label: "Gluten Free", icon: <WheatIcon className="size-4" aria-hidden /> },
  { value: "spicy", label: "Spicy", icon: <FilterIcon className="size-4" aria-hidden /> },
  {
    value: "chefSpecial",
    label: "Chef Special",
    icon: <ChefHatIcon className="size-4" aria-hidden />,
  },
];

const MENU_PAGE_SIZE = 24;

type MenuDiscoveryProps = {
  initialCategory?: string | undefined;
  initialOutlet?: string | undefined;
  initialSearch?: string | undefined;
  initialDietary?: string[] | undefined;
};

export function MenuDiscovery({
  initialCategory,
  initialOutlet,
  initialSearch,
  initialDietary,
}: MenuDiscoveryProps = {}) {
  const orgSlug = useOrgSlug();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch ?? "");
  const [activeCategoryId, setActiveCategoryId] = useState<string | "all">(initialCategory ?? "all");
  const [activeOutletId, setActiveOutletId] = useState<string>(initialOutlet ?? "");
  const [activeDietary, setActiveDietary] = useState<DietaryTag[]>((initialDietary as DietaryTag[]) ?? []);
  const [page, setPage] = useState(1);
  const addItem = useCartStore((state) => state.addItem);

  const { data: outletsData } = useOutlets(orgSlug, undefined, 1, 50);
  const outlets = outletsData?.data ?? [];
  const firstCafeId = outlets[0]?.id ?? undefined;
  const { data: categoriesData } = useCategories(orgSlug, firstCafeId);
  const categoriesFromApi = useMemo(() => categoriesData ?? [], [categoriesData]);

  const filters = useMemo(
    () => ({
      ...(activeCategoryId && activeCategoryId !== "all" && { category: activeCategoryId }),
      ...(activeOutletId && { outletId: activeOutletId }),
      ...(search.trim() && { search: search.trim() }),
      ...(activeDietary.length > 0 && { dietary: activeDietary }),
    }),
    [activeCategoryId, activeOutletId, search, activeDietary],
  );

  const { data: menuData, isPending } = useMenuItems(orgSlug, filters, page, MENU_PAGE_SIZE);
  const apiItems = menuData?.data ?? [];
  const totalPages = menuData?.meta?.totalPages ?? 1;
  const total = menuData?.meta?.total ?? 0;

  const menuItems: MenuItem[] = useMemo(
    () =>
      apiItems.map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description ?? "",
        price: `${m.currency ?? "KES"} ${(m.price ?? 0).toLocaleString()}`,
        priceValue: m.price ?? 0,
        category: m.category || "Other",
        categoryId: m.categoryId ?? "",
        dietary: (m.dietary ?? []) as DietaryTag[],
        ...(m.image != null && m.image !== "" && { image: m.image }),
        outletId: m.outletId,
        outletName: m.outletName,
        ...(m.featured && { feature: "recommended" as const }),
      })),
    [apiItems],
  );

  const updateUrl = useCallback(
    (updates: { category?: string | undefined; outlet?: string | undefined; search?: string | undefined; dietary?: string | undefined }) => {
      const p = new URLSearchParams(searchParams?.toString() ?? "");
      if (updates.category !== undefined) (updates.category && updates.category !== "all") ? p.set("category", updates.category) : p.delete("category");
      if (updates.outlet !== undefined) updates.outlet ? p.set("outlet", updates.outlet) : p.delete("outlet");
      if (updates.search !== undefined) updates.search ? p.set("search", updates.search) : p.delete("search");
      if (updates.dietary !== undefined) updates.dietary ? p.set("dietary", updates.dietary) : p.delete("dietary");
      const q = p.toString();
      router.replace(q ? `?${q}` : window.location.pathname, { scroll: false });
    },
    [router, searchParams],
  );

  useEffect(() => {
    if (initialCategory != null) setActiveCategoryId(initialCategory || "all");
    if (initialOutlet != null) setActiveOutletId(initialOutlet);
    if (initialSearch != null) setSearch(initialSearch);
    if (initialDietary != null) setActiveDietary(initialDietary as DietaryTag[]);
  }, [initialCategory, initialOutlet, initialSearch, initialDietary]);

  const handleAddToCart = (item: MenuItem) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.priceValue,
      ...(item.outletId && { outletId: item.outletId }),
      ...(item.outletName && { outletName: item.outletName }),
    });
    toast.success(`Added ${item.name} to cart`);
  };

  return (
    <section className="border-t border-border bg-card py-8 sm:py-12 md:py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 sm:gap-6 md:gap-8">
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-brand-surface/40 p-4 shadow-sm sm:gap-6 sm:rounded-3xl sm:p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex-1 space-y-2">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl md:text-3xl">
              Browse the {activeCategoryId === "all" ? "full menu" : (categoriesFromApi.find((c) => c.id === activeCategoryId)?.name ?? "menu").toLowerCase()}
            </h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Filter by dietary preference, explore specials, and build your cart seamlessly.
            </p>
          </div>
          <div className="w-full md:max-w-md">
            <label htmlFor="menu-search" className="sr-only">
              Search menu items
            </label>
            <div className="relative">
              <SearchIcon
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="menu-search"
                placeholder="Search dishes, ingredients, or categories"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onBlur={() => updateUrl({ search: search.trim() || undefined })}
                onKeyDown={(e) => e.key === "Enter" && updateUrl({ search: search.trim() || undefined })}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Category filters from backend */}
        <div className="flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-x-visible sm:pb-0">
          <Button
            type="button"
            size="sm"
            variant={activeCategoryId === "all" ? "default" : "outline"}
            onClick={() => {
              setActiveCategoryId("all");
              setPage(1);
              updateUrl({ category: undefined });
            }}
            className={cn(
              "shrink-0",
              activeCategoryId === "all"
                ? "bg-brand text-brand-contrast shadow-soft"
                : "border-border text-muted-foreground hover:border-brand-emphasis hover:text-brand-emphasis",
            )}
          >
            All
          </Button>
          {categoriesFromApi.map((cat) => (
            <Button
              key={cat.id}
              type="button"
              size="sm"
              variant={activeCategoryId === cat.id ? "default" : "outline"}
              onClick={() => {
                setActiveCategoryId(cat.id);
                setPage(1);
                updateUrl({ category: cat.id });
              }}
              className={cn(
                "shrink-0",
                activeCategoryId === cat.id
                  ? "bg-brand text-brand-contrast shadow-soft"
                  : "border-border text-muted-foreground hover:border-brand-emphasis hover:text-brand-emphasis",
              )}
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Outlet filter when multiple */}
        {outlets.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground self-center">Outlet:</span>
            {outlets.map((out) => (
              <Button
                key={out.id}
                type="button"
                size="sm"
                variant={activeOutletId === out.id ? "default" : "outline"}
                onClick={() => {
                  setActiveOutletId(activeOutletId === out.id ? "" : out.id);
                  setPage(1);
                  updateUrl({ outlet: activeOutletId === out.id ? undefined : out.id });
                }}
                className="shrink-0"
              >
                {out.name}
              </Button>
            ))}
          </div>
        )}

        {/* Dietary filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-x-visible sm:pb-0">
          {dietaryFilterOpts.map((filter) => {
            const isActive = activeDietary.includes(filter.value);
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => {
                  const next = isActive ? activeDietary.filter((tag) => tag !== filter.value) : [...activeDietary, filter.value];
                  setActiveDietary(next);
                  setPage(1);
                  updateUrl({ dietary: next.length ? next.join(",") : undefined });
                }}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  isActive
                    ? "border-brand-emphasis bg-brand-emphasis/10 text-brand-emphasis"
                    : "border-border text-muted-foreground hover:border-brand-emphasis hover:text-brand-emphasis",
                )}
              >
                {filter.icon}
                <span>{filter.label}</span>
              </button>
            );
          })}
        </div>

        {/* Menu items grid - Mobile: Single column, Tablet: 2 columns, Desktop: 3 columns */}
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {isPending && menuItems.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-border bg-card p-6 text-center sm:rounded-3xl sm:p-8">
              <p className="text-sm text-muted-foreground">Loading menu…</p>
            </div>
          ) : menuItems.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-border bg-card p-6 text-center sm:rounded-3xl sm:p-8">
              <p className="text-xs text-muted-foreground sm:text-sm">
                No menu items match the current filters. Try clearing a dietary preference or
                adjusting your search.
              </p>
            </div>
          ) : (
            menuItems.map((item) => (
              <article
                key={item.id}
                className="flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:rounded-3xl"
              >
                {/* Image - Fixed 240x240 */}
                {item.image && (
                  <div className="relative h-60 w-full overflow-hidden bg-muted">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-300 hover:scale-105"
                      sizes="100vw"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex flex-1 flex-col p-4 sm:p-6">
                  <div className="space-y-2 sm:space-y-3">
                    <header className="flex items-start justify-between gap-2 sm:gap-3">
                      <h3 className="text-base font-semibold text-foreground sm:text-lg">
                        {item.name}
                      </h3>
                      <div className="flex shrink-0 gap-1">
                        {item.feature === "recommended" ? (
                          <span className="rounded-full bg-brand-muted px-2 py-0.5 text-[10px] font-medium text-brand-emphasis sm:px-3 sm:py-1 sm:text-xs">
                            ⭐
                          </span>
                        ) : null}
                        {item.feature === "new" ? (
                          <span className="rounded-full bg-brand-emphasis/10 px-2 py-0.5 text-[10px] font-medium text-brand-emphasis sm:px-3 sm:py-1 sm:text-xs">
                            New
                          </span>
                        ) : null}
                      </div>
                    </header>
                    <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                      {item.description}
                    </p>
                  </div>
                  <footer className="mt-4 space-y-3 sm:mt-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-base font-semibold text-foreground sm:text-sm">
                        {item.price}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {item.dietary.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-brand-muted px-1.5 py-0.5 text-[10px] font-medium text-brand-dark sm:px-2 sm:text-[11px]"
                          >
                            {dietaryFilterOpts.find((f) => f.value === tag)?.label ?? tag}
                          </span>
                        ))}
                        {item.dietary.length > 3 && (
                          <span className="rounded-full bg-brand-muted px-1.5 py-0.5 text-[10px] font-medium text-brand-dark sm:px-2 sm:text-[11px]">
                            +{item.dietary.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button onClick={() => handleAddToCart(item)} className="w-full min-h-[44px]" size="sm">
                      <ShoppingCartIcon className="mr-2 size-4" />
                      Add to Cart
                    </Button>
                  </footer>
                </div>
              </article>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || isPending}
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
              }}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages} ({total} items)
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isPending}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
