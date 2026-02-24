"use client";

import { useMemo, useState } from "react";

import {
  ChefHatIcon,
  FilterIcon,
  SearchIcon,
  ShoppingCart as ShoppingCartIcon,
  SproutIcon,
  WheatIcon,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

import { useCartStore } from "@/store/cart";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DietaryTag = "vegan" | "vegetarian" | "glutenFree" | "spicy" | "chefSpecial";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: string;
  priceValue: number; // numeric value for cart
  category: string;
  dietary: DietaryTag[];
  feature?: "recommended" | "new";
  image?: string;
  outletId?: string;
  outletName?: string;
};

const dietaryFilters: Array<{ value: DietaryTag; label: string; icon: React.ReactNode }> = [
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

const mockMenu: MenuItem[] = [
  {
    id: "caf-cappuccino",
    name: "Classic Cappuccino",
    description: "Rich espresso with steamed milk and velvety foam",
    price: "KES 350",
    priceValue: 350,
    category: "Beverages",
    dietary: ["vegan"],
    feature: "recommended",
    image: "/images/menu/cappuccino.jpg",
    outletName: "Main Outlet",
  },
  {
    id: "caf-pizza",
    name: "Margherita Pizza",
    description: "Fresh mozzarella, basil, and tomato on crispy artisan crust",
    price: "KES 850",
    priceValue: 850,
    category: "Main Course",
    dietary: ["vegetarian"],
    image: "/images/menu/margherita-pizza.jpg",
    outletName: "Main Outlet",
  },
  {
    id: "caf-burger",
    name: "Classic Burger",
    description: "Juicy beef patty with lettuce, tomato, and special sauce",
    price: "KES 750",
    priceValue: 750,
    category: "Main Course",
    dietary: ["chefSpecial"],
    feature: "new",
    image: "/images/menu/burger.jpg",
    outletName: "Main Outlet",
  },
  {
    id: "caf-espresso",
    name: "Espresso Shot",
    description: "Bold, rich espresso perfectly pulled with crema",
    price: "KES 280",
    priceValue: 280,
    category: "Beverages",
    dietary: ["vegan", "glutenFree"],
    image: "/images/menu/espresso.jpg",
    outletName: "Main Outlet",
  },
  {
    id: "caf-lava-cake",
    name: "Chocolate Lava Cake",
    description: "Decadent chocolate cake with molten center and ice cream",
    price: "KES 520",
    priceValue: 520,
    category: "Desserts",
    dietary: ["vegetarian"],
    feature: "recommended",
    image: "/images/menu/chocolate-lava-cake.jpg",
    outletName: "Main Outlet",
  },
  {
    id: "caf-salad",
    name: "Caesar Salad",
    description: "Fresh romaine lettuce with parmesan, croutons, and caesar dressing",
    price: "KES 620",
    priceValue: 620,
    category: "Salads",
    dietary: ["vegetarian", "glutenFree"],
    image: "/images/menu/salad.jpg",
    outletName: "Main Outlet",
  },
  {
    id: "caf-breakfast",
    name: "Full English Breakfast",
    description: "Eggs, bacon, sausage, baked beans, mushrooms, and toast",
    price: "KES 720",
    priceValue: 720,
    category: "Breakfast",
    dietary: ["glutenFree"],
    image: "/images/menu/breakfast.jpg",
    outletName: "Main Outlet",
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
  const addItem = useCartStore((state) => state.addItem);

  const categories = useMemo(() => getCategories(mockMenu), []);

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
    <section className="border-t border-border bg-card py-8 sm:py-12 md:py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 sm:gap-6 md:gap-8">
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-brand-surface/40 p-4 shadow-sm sm:gap-6 sm:rounded-3xl sm:p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex-1 space-y-2">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl md:text-3xl">
              Browse the {activeCategory === "All" ? "full menu" : activeCategory.toLowerCase()}
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
                onChange={(event) => setSearch(event.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Category filters - Mobile: Scrollable horizontal, Desktop: Wrap */}
        <div className="flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-x-visible sm:pb-0">
          {categories.map((category) => (
            <Button
              key={category}
              type="button"
              size="sm"
              variant={activeCategory === category ? "default" : "outline"}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "shrink-0",
                activeCategory === category
                  ? "bg-brand text-brand-contrast shadow-soft"
                  : "border-border text-muted-foreground hover:border-brand-emphasis hover:text-brand-emphasis",
              )}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Dietary filters - Mobile: Scrollable horizontal, Desktop: Wrap */}
        <div className="flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-x-visible sm:pb-0">
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
          {filteredItems.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-border bg-card p-6 text-center sm:rounded-3xl sm:p-8">
              <p className="text-xs text-muted-foreground sm:text-sm">
                No menu items match the current filters. Try clearing a dietary preference or
                adjusting your search.
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
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
                            {dietaryFilters.find((filter) => filter.value === tag)?.label ?? tag}
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
      </div>
    </section>
  );
}
