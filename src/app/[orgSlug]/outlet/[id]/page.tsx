"use client";

import { ArrowLeft, Clock, Heart, MapPin, Phone, Search, ShoppingCart, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { SiteShell } from "@/components/layout/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { orgRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useCartStore } from "@/store/cart";
import type { DietaryTag, MenuItem, Outlet } from "@/types/menu";

// Mock outlet data - In production, this would come from useOutlet hook
const mockOutlets: Record<string, Outlet> = {
  "ulc-busia": {
    id: "ulc-busia",
    name: "Urban Loft Cafe Busia",
    description:
      "Experience the finest coffee and artisan cuisine in a warm, modern atmosphere. Our Busia location offers a perfect blend of comfort food and premium beverages.",
    address: "Busia Mall, Busia Road, Kenya",
    latitude: -1.2424,
    longitude: 36.7498,
    phone: "+254 700 123 456",
    email: "busia@urbanloftcafe.com",
    rating: 4.8,
    reviewCount: 2450,
    deliveryTime: "20-30",
    deliveryFee: "Free",
    minimumOrder: 500,
    cuisines: ["Cafe", "Bakery", "Breakfast", "Lunch"],
    image: "/images/outlets/urban-loft-busia.jpeg",
    isOpen: true,
    promoted: true,
    offerBadge: "Free Delivery",
    businessType: "food",
  },
};

// Mock menu items for outlets
const mockMenuItems: MenuItem[] = [
  {
    id: "item-1",
    name: "Classic Cappuccino",
    description: "Rich espresso with steamed milk and velvety foam",
    price: 350,
    currency: "KES",
    category: "Beverages",
    categoryId: "beverages",
    dietary: ["vegan"],
    image: "/images/menu/cappuccino.jpg",
    outletId: "ulc-busia",
    outletName: "Urban Loft Cafe Busia",
    available: true,
    featured: true,
    preparationTime: 5,
  },
  {
    id: "item-2",
    name: "Margherita Pizza",
    description: "Fresh mozzarella, basil, and tomato on crispy artisan crust",
    price: 850,
    currency: "KES",
    category: "Main Course",
    categoryId: "main-course",
    dietary: ["vegetarian"],
    image: "/images/menu/margherita-pizza.jpg",
    outletId: "ulc-busia",
    outletName: "Urban Loft Cafe Busia",
    available: true,
    preparationTime: 20,
  },
  {
    id: "item-3",
    name: "Classic Burger",
    description: "Juicy beef patty with lettuce, tomato, and special sauce",
    price: 750,
    currency: "KES",
    category: "Main Course",
    categoryId: "main-course",
    dietary: ["chefSpecial"],
    image: "/images/menu/burger.jpg",
    outletId: "ulc-busia",
    outletName: "Urban Loft Cafe Busia",
    available: true,
    featured: true,
    discountPercent: 12,
    originalPrice: 850,
    preparationTime: 15,
  },
  {
    id: "item-4",
    name: "Espresso",
    description: "Bold, rich espresso shot, perfectly pulled",
    price: 280,
    currency: "KES",
    category: "Beverages",
    categoryId: "beverages",
    dietary: ["vegan", "glutenFree"],
    image: "/images/menu/espresso.jpg",
    outletId: "ulc-busia",
    outletName: "Urban Loft Cafe Busia",
    available: true,
    preparationTime: 3,
  },
  {
    id: "item-5",
    name: "Chocolate Lava Cake",
    description: "Decadent chocolate cake with molten center and ice cream",
    price: 520,
    currency: "KES",
    category: "Desserts",
    categoryId: "desserts",
    dietary: ["vegetarian"],
    image: "/images/menu/chocolate-lava-cake.jpg",
    outletId: "ulc-busia",
    outletName: "Urban Loft Cafe Busia",
    available: true,
    featured: true,
    discountPercent: 13,
    originalPrice: 600,
    preparationTime: 10,
  },
  {
    id: "item-6",
    name: "Caesar Salad",
    description: "Fresh romaine lettuce with parmesan, croutons, and caesar dressing",
    price: 620,
    currency: "KES",
    category: "Salads",
    categoryId: "salads",
    dietary: ["vegetarian", "glutenFree"],
    image: "/images/menu/salad.jpg",
    outletId: "ulc-busia",
    outletName: "Urban Loft Cafe Busia",
    available: true,
    preparationTime: 8,
  },
];

const dietaryLabels: Record<DietaryTag, string> = {
  vegan: "Vegan",
  vegetarian: "Vegetarian",
  glutenFree: "GF",
  spicy: "Spicy",
  chefSpecial: "Chef's",
  halal: "Halal",
};

function MenuItemCard({ item, onAddToCart }: { item: MenuItem; onAddToCart: () => void }) {
  const orgSlug = useOrgSlug();
  return (
    <div className="group flex gap-4 rounded-xl border border-border bg-card p-4 transition hover:shadow-md">
      {/* Content */}
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-foreground">{item.name}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
          </div>
        </div>

        {/* Tags */}
        <div className="mt-2 flex flex-wrap gap-1">
          {item.dietary.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
            >
              {dietaryLabels[tag]}
            </span>
          ))}
          {item.featured && (
            <span className="rounded-full bg-yellow-500/10 px-1.5 py-0.5 text-[10px] font-medium text-yellow-600">
              Featured
            </span>
          )}
        </div>

        {/* Price and Add Button */}
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">
              {item.currency} {item.price.toLocaleString()}
            </span>
            {item.originalPrice && item.originalPrice > item.price && (
              <span className="text-xs text-muted-foreground line-through">
                {item.currency} {item.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          <Button size="sm" onClick={onAddToCart}>
            <ShoppingCart className="mr-1 size-3" />
            Add
          </Button>
        </div>
      </div>

      {/* Image */}
      <Link
        href={orgRoute(orgSlug, `/menu/${item.id}`)}
        className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-28"
      >
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover transition group-hover:scale-105"
            sizes="112px"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <span className="text-2xl opacity-30">🍽️</span>
          </div>
        )}
        {item.discountPercent && item.discountPercent > 0 && (
          <div className="absolute left-1 top-1">
            <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              -{item.discountPercent}%
            </span>
          </div>
        )}
      </Link>
    </div>
  );
}

export default function OutletPage() {
  const params = useParams();
  const router = useRouter();
  const outletId = params.id as string;

  // In production, use: const { data: outlet } = useOutlet(outletId);
  const outlet = mockOutlets[outletId] || mockOutlets["ulc-busia"];

  // In production, use: const { data: menuData } = useOutletMenu(outletId);
  const menuItems = mockMenuItems.filter(
    (item) => item.outletId === outletId || item.outletId === "ulc-busia",
  );

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [isFavorite, setIsFavorite] = useState(false);

  const addItem = useCartStore((state) => state.addItem);

  // Get unique categories
  const categories = useMemo(() => {
    const unique = new Set(menuItems.map((item) => item.category));
    return ["All", ...Array.from(unique)];
  }, [menuItems]);

  // Filter items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      const matchesSearch =
        search.length === 0 ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, activeCategory, search]);

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    filteredItems.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  const handleAddToCart = (item: MenuItem) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      outletId: item.outletId,
      outletName: item.outletName,
    });
    toast.success(`Added ${item.name} to cart`);
  };

  return (
    <SiteShell>
      {/* Hero Section with Outlet Info */}
      <div className="relative">
        {/* Cover Image */}
        <div className="relative h-48 w-full bg-muted sm:h-64">
          {outlet.image ? (
            <Image
              src={outlet.image}
              alt={outlet.name}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <span className="text-6xl opacity-30">🏪</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-background/90 px-3 py-2 text-sm font-medium shadow-sm backdrop-blur-sm hover:bg-background"
          >
            <ArrowLeft className="size-4" />
            Back
          </button>

          {/* Favorite Button */}
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className={cn(
              "absolute right-4 top-4 rounded-full bg-background/90 p-2 shadow-sm backdrop-blur-sm transition",
              isFavorite ? "text-red-500" : "text-muted-foreground hover:text-foreground",
            )}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart className={cn("size-5", isFavorite && "fill-current")} />
          </button>
        </div>

        {/* Outlet Info */}
        <div className="mx-auto w-full max-w-4xl px-4">
          <div className="relative -mt-16 rounded-2xl border border-border bg-card p-4 shadow-lg sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-foreground sm:text-2xl">{outlet.name}</h1>
                  {outlet.offerBadge && (
                    <span className="rounded-full bg-green-500 px-2 py-0.5 text-xs font-semibold text-white">
                      {outlet.offerBadge}
                    </span>
                  )}
                </div>

                <p className="text-sm text-muted-foreground">{outlet.description}</p>

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-4 pt-2 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="size-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{outlet.rating}</span>
                    <span className="text-muted-foreground">({outlet.reviewCount}+)</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="size-4" />
                    <span>{outlet.deliveryTime} min</span>
                  </div>
                  <span
                    className={cn(
                      "font-medium",
                      outlet.deliveryFee === "Free" ? "text-green-600" : "text-muted-foreground",
                    )}
                  >
                    {outlet.deliveryFee === "Free" ? "Free Delivery" : outlet.deliveryFee}
                  </span>
                </div>

                {/* Cuisines */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {outlet.cuisines.map((cuisine) => (
                    <span
                      key={cuisine}
                      className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {cuisine}
                    </span>
                  ))}
                </div>
              </div>

              {/* Contact */}
              <div className="flex shrink-0 flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-4" />
                  <span>{outlet.address}</span>
                </div>
                {outlet.phone && (
                  <a
                    href={`tel:${outlet.phone}`}
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Phone className="size-4" />
                    <span>{outlet.phone}</span>
                  </a>
                )}
                <div
                  className={cn(
                    "mt-1 flex items-center gap-1 font-medium",
                    outlet.isOpen ? "text-green-600" : "text-destructive",
                  )}
                >
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      outlet.isOpen ? "bg-green-500" : "bg-destructive",
                    )}
                  />
                  {outlet.isOpen ? "Open Now" : "Closed"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Section */}
      <div className="mx-auto w-full max-w-4xl px-4 py-6">
        {/* Search and Filters */}
        <div className="sticky top-16 z-10 space-y-4 border-b border-border bg-background pb-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search menu items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((category) => (
              <Button
                key={category}
                size="sm"
                variant={activeCategory === category ? "default" : "outline"}
                onClick={() => setActiveCategory(category)}
                className="shrink-0"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div className="mt-6 space-y-8">
          {Object.entries(itemsByCategory).map(([category, items]) => (
            <div key={category}>
              <h2 className="mb-4 text-lg font-semibold text-foreground">{category}</h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onAddToCart={() => handleAddToCart(item)}
                  />
                ))}
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-muted-foreground">No items match your search.</p>
            </div>
          )}
        </div>
      </div>
    </SiteShell>
  );
}
