"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ChefHatIcon,
  FilterIcon,
  Heart,
  SearchIcon,
  ShoppingCart as ShoppingCartIcon,
  SproutIcon,
  WheatIcon
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCategories, useCatalogItems, useOutlets, useToggleFavorite } from "@/hooks/use-catalog";
import { orgRoute } from "@/lib/routes";
import { cn, getMediaUrl } from "@/lib/utils";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useCartStore } from "@/store/cart";
import type { DietaryTag } from "@/types/catalog";

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
  isFavorite?: boolean | undefined;
} & Record<string, any>;

function DiscoveryMenuItem({
  item,
  orgSlug,
  onAddToCart,
}: {
  item: MenuItem;
  orgSlug: string;
  onAddToCart: (item: MenuItem) => void;
}) {
  const router = useRouter();
  const itemUrl = item.id ? `/${orgSlug}/catalog/${item.id}` : "#";
  const { mutate: toggleFavorite } = useToggleFavorite(orgSlug);
  const [isWhitelisted, setIsWhitelisted] = useState(item.isFavorite ?? false);

  const toggleWhitelist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWhitelisted(!isWhitelisted);
    toggleFavorite(item.id);
  };

  return (
    <article
      key={item.id}
      data-menu-item-id={item.id}
      onClick={() => router.push(itemUrl)}
      className="flex h-full cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:rounded-3xl"
    >
      {/* Image - Fixed 240x240 */}
      <div className="relative h-60 w-full overflow-hidden bg-muted">
        {item.image ? (
          <Image
            src={getMediaUrl(item.image)}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <span className="text-4xl opacity-30">🍽️</span>
          </div>
        )}

        {/* Whitelist Toggle */}
        <button
          onClick={toggleWhitelist}
          className="absolute right-2 top-2 z-10 flex size-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition-all hover:scale-110 sm:size-9"
          aria-label="Add to whitelist"
        >
          <Heart
            className={cn(
              "size-4 transition-colors",
              isWhitelisted ? "fill-red-500 text-red-500" : "text-muted-foreground",
            )}
          />
        </button>
      </div>

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
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
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
            </div>
          </div>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(item);
            }}
            className="w-full min-h-[44px]"
            size="sm"
          >
            <ShoppingCartIcon className="mr-2 size-4" />
            Add to Cart
          </Button>
        </footer>
      </div>
    </article>
  );
}

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
  /** Optional deep-link action, e.g. /menu?item_id=...&action=add-to-cart|view|whitelist */
  initialItemId?: string | undefined;
  initialAction?: string | undefined;
  initialFavoriteOnly?: boolean | undefined;
};

export function MenuDiscovery({
  initialCategory,
  initialOutlet,
  initialSearch,
  initialDietary,
  initialItemId,
  initialAction,
  initialFavoriteOnly,
}: MenuDiscoveryProps = {}) {
  const orgSlug = useOrgSlug();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch ?? "");
  const [activeCategoryId, setActiveCategoryId] = useState<string | "all">(initialCategory ?? "all");
  const [activeOutletId, setActiveOutletId] = useState<string>(initialOutlet ?? "");
  const [activeDietary, setActiveDietary] = useState<DietaryTag[]>((initialDietary as DietaryTag[]) ?? []);
  const [favoriteOnly, setFavoriteOnly] = useState(initialFavoriteOnly ?? false);
  const [page, setPage] = useState(1);
  const addItem = useCartStore((state) => state.addItem);

  const { data: outletsData } = useOutlets(orgSlug, undefined, 1, 50);
  const outlets = outletsData?.data ?? [];
  const firstOutletId = outlets[0]?.id ?? undefined;
  const { data: categoriesData } = useCategories(orgSlug, firstOutletId);
  const categoriesFromApi = useMemo(() => categoriesData ?? [], [categoriesData]);

  const filters = useMemo(
    () => ({
      ...(activeCategoryId && activeCategoryId !== "all" && { category: activeCategoryId }),
      ...(activeOutletId && { outletId: activeOutletId }),
      ...(search.trim() && { search: search.trim() }),
      ...(activeDietary.length > 0 && { dietary: activeDietary }),
      ...(favoriteOnly && { favoriteOnly: true }),
    }),
    [activeCategoryId, activeOutletId, search, activeDietary, favoriteOnly],
  );

  const { data: menuData, isPending } = useCatalogItems(orgSlug, filters, page, MENU_PAGE_SIZE);
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
        isFavorite: m.isFavorite,
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
    if (initialFavoriteOnly != null) setFavoriteOnly(initialFavoriteOnly);
  }, [initialCategory, initialOutlet, initialSearch, initialDietary, initialFavoriteOnly]);

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

  // Handle deep-linked item actions from /menu?item_id=&action=
  useEffect(() => {
    if (!initialItemId || !initialAction) return;
    const action = initialAction as "add-to-cart" | "view" | "whitelist";
    const target = menuItems.find((m) => m.id === initialItemId);
    if (!target) return;

    if (action === "add-to-cart") {
      handleAddToCart(target);
      toast.success(`Added ${target.name} to cart`);
    } else if (action === "view") {
      // Scroll to the item card and highlight; for now just scroll into view.
      const el = document.querySelector<HTMLElement>(`[data-menu-item-id="${target.id}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    // Whitelist action intentionally no-op here; reserved for future feature flags.
  }, [initialItemId, initialAction, menuItems]);

  return (
    <section className="border-t border-border bg-card py-8 sm:py-12 md:py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 sm:gap-6 md:gap-8">
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-brand-surface/40 p-4 shadow-sm sm:gap-6 sm:rounded-3xl sm:p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex-1 space-y-2">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl md:text-3xl">
              Browse the {activeCategoryId === "all" ? "full catalog" : (categoriesFromApi.find((c) => c.id === activeCategoryId)?.name ?? "catalog").toLowerCase()}
            </h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Filter by dietary preference, explore specials, and build your cart seamlessly.
            </p>
          </div>
          <div className="w-full md:max-w-md">
            <label htmlFor="menu-search" className="sr-only">
              Search catalog items
            </label>
            <div className="relative">
              <SearchIcon
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="menu-search"
                placeholder="Search items, products, or categories"
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
                "shrink-0 h-10 gap-2 px-4 rounded-xl",
                activeCategoryId === cat.id
                  ? "bg-brand text-brand-contrast shadow-soft"
                  : "border-border text-muted-foreground hover:border-brand-emphasis hover:text-brand-emphasis",
              )}
            >
              {cat.image ? (
                <div className="relative size-5 overflow-hidden rounded-full border border-current/10">
                  <Image
                    src={getMediaUrl(cat.image)}
                    alt={cat.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <ChefHatIcon className="size-4 opacity-40" />
              )}
              <span className="font-bold">{cat.name}</span>
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
          <button
            type="button"
            onClick={() => {
              router.push(orgRoute(orgSlug, "/favorites"));
            }}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              initialAction === "whitelist"
                ? "border-red-500 bg-red-50 text-red-600"
                : "border-border text-muted-foreground hover:border-red-500 hover:text-red-600",
            )}
          >
            <Heart className={cn("size-4", initialAction === "whitelist" && "fill-current")} aria-hidden />
            <span>Favorites</span>
          </button>
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
              <p className="text-sm text-muted-foreground">Loading catalog…</p>
            </div>
          ) : menuItems.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-border bg-card p-6 text-center sm:rounded-3xl sm:p-8">
              <p className="text-xs text-muted-foreground sm:text-sm">
                No items match the current filters. Try clearing a filter or
                adjusting your search.
              </p>
            </div>
          ) : (
            menuItems.map((item) => (
              <DiscoveryMenuItem
                key={item.id}
                item={item}
                orgSlug={orgSlug}
                onAddToCart={handleAddToCart}
              />
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
