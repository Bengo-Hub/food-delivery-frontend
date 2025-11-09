"use client";

import { useMemo, useState } from "react";

import { ChefHatIcon, FilterIcon, SearchIcon, SproutIcon, WheatIcon } from "lucide-react";

import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { cn } from "@/lib/utils";

type DietaryTag = "vegan" | "vegetarian" | "glutenFree" | "spicy" | "chefSpecial";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  dietary: DietaryTag[];
  feature?: "recommended" | "new";
};

const dietaryFilters: Array<{ value: DietaryTag; label: string; icon: React.ReactNode }> = [
  { value: "vegan", label: "Vegan", icon: <SproutIcon className="size-4" aria-hidden /> },
  { value: "vegetarian", label: "Vegetarian", icon: <SproutIcon className="size-4" aria-hidden /> },
  { value: "glutenFree", label: "Gluten Free", icon: <WheatIcon className="size-4" aria-hidden /> },
  { value: "spicy", label: "Spicy", icon: <FilterIcon className="size-4" aria-hidden /> },
  { value: "chefSpecial", label: "Chef Special", icon: <ChefHatIcon className="size-4" aria-hidden /> },
];

const mockMenu: MenuItem[] = [
  {
    id: "caf-espresso-tonic",
    name: "Citrus Espresso Tonic",
    description: "Cold brew espresso over craft tonic, finished with candied orange peel.",
    price: "KES 480",
    category: "Beverages",
    dietary: ["vegan"],
    feature: "recommended",
  },
  {
    id: "caf-busia-bowl",
    name: "Busia Sunrise Bowl",
    description: "Sorghum tabbouleh, roasted pumpkin, avocado crema, and tamarind dressing.",
    price: "KES 820",
    category: "Bowls",
    dietary: ["vegetarian", "glutenFree"],
  },
  {
    id: "caf-ugali-bites",
    name: "Smoked Tilapia Ugali Bites",
    description: "Mini ugali cakes topped with smoked tilapia and herb yogurt drizzle.",
    price: "KES 640",
    category: "Small Plates",
    dietary: ["chefSpecial"],
    feature: "new",
  },
  {
    id: "caf-mandazi",
    name: "Spiced Mandazi Flight",
    description: "Trio of house-made mandazi with orange blossom, cardamom, and cocoa dusting.",
    price: "KES 540",
    category: "Pastries",
    dietary: ["vegetarian"],
  },
  {
    id: "caf-sip",
    name: "Iced Hibiscus Cold Brew",
    description: "Hibiscus cold brew infused with pineapple syrup and mint.",
    price: "KES 420",
    category: "Beverages",
    dietary: ["vegan", "glutenFree"],
  },
];

const getCategories = (items: MenuItem[]): string[] => {
  const unique = new Set(items.map((item) => item.category));
  return ["All", ...Array.from(unique)];
};

export function MenuDiscovery() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeDietary, setActiveDietary] = useState<DietaryTag[]>([]);

  const categories = useMemo(() => getCategories(mockMenu), []);

  const filteredItems = useMemo(() => {
    return mockMenu.filter((item) => {
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      const matchesDietary =
        activeDietary.length === 0 || activeDietary.every((tag) => item.dietary.includes(tag));
      const matchesSearch =
        search.length === 0 ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase());

      return matchesCategory && matchesDietary && matchesSearch;
    });
  }, [activeCategory, activeDietary, search]);

  return (
    <section className="border-t border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4">
        <div className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-brand-surface/40 p-6 shadow-sm dark:border-slate-800 dark:bg-brand-dark/30 md:flex-row md:items-center md:justify-between">
          <div className="flex-1 space-y-2">
            <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">
              Browse the {activeCategory === "All" ? "full menu" : activeCategory.toLowerCase()}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Filter by dietary preference, explore chef specials, and build your cart seamlessly. All menu
              content syncs with the cafe dashboard and inventory services in real time.
            </p>
          </div>
          <div className="w-full max-w-md">
            <label htmlFor="menu-search" className="sr-only">
              Search menu items
            </label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <Input
                id="menu-search"
                placeholder="Search dishes, ingredients, or categories"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              type="button"
              size="sm"
              variant={activeCategory === category ? "primary" : "outline"}
              onClick={() => setActiveCategory(category)}
              className={cn(
                activeCategory === category
                  ? "bg-brand text-brand-contrast shadow-soft"
                  : "border-slate-200 text-slate-600 hover:border-brand-emphasis hover:text-brand-emphasis dark:border-slate-700 dark:text-slate-300",
              )}
            >
              {category}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {dietaryFilters.map((filter) => {
            const isActive = activeDietary.includes(filter.value);
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() =>
                  setActiveDietary((prev) =>
                    isActive ? prev.filter((tag) => tag !== filter.value) : [...prev, filter.value],
                  )
                }
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  isActive
                    ? "border-brand-emphasis bg-brand-emphasis/10 text-brand-emphasis"
                    : "border-slate-200 text-slate-500 hover:border-brand-emphasis hover:text-brand-emphasis dark:border-slate-700 dark:text-slate-300",
                )}
              >
                {filter.icon}
                <span>{filter.label}</span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.length === 0 ? (
            <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-sm text-slate-500 dark:text-slate-300">
                No menu items match the current filters. Try clearing a dietary preference or adjusting your
                search.
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <article
                key={item.id}
                className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/70"
              >
                <div className="space-y-3">
                  <header className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{item.name}</h3>
                    {item.feature === "recommended" ? (
                      <span className="rounded-full bg-brand-muted px-3 py-1 text-xs font-medium text-brand-emphasis">
                        Recommended
                      </span>
                    ) : null}
                    {item.feature === "new" ? (
                      <span className="rounded-full bg-brand-emphasis/10 px-3 py-1 text-xs font-medium text-brand-emphasis">
                        New
                      </span>
                    ) : null}
                  </header>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
                </div>
                <footer className="mt-6 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-900 dark:text-white">{item.price}</span>
                  <div className="flex flex-wrap gap-1">
                    {item.dietary.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-brand-muted px-2 py-0.5 text-[11px] font-medium text-brand-dark dark:text-brand-contrast"
                      >
                        {dietaryFilters.find((filter) => filter.value === tag)?.label ?? tag}
                      </span>
                    ))}
                  </div>
                </footer>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

