"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  ChevronDown,
  LayoutDashboard,
  LogIn,
  LogOut,
  MapPin,
  MenuIcon,
  Search,
  ShoppingCart,
  UserIcon,
} from "lucide-react";

import { CartDrawer } from "@/components/cart/cart-drawer";
import { DiningModeToggle } from "@/components/layout/dining-mode-toggle";
import { LocationDialog } from "@/components/layout/location-dialog";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenuDrawer } from "@/components/layout/user-menu-drawer";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { brand } from "@/config/brand";
import { useOutlets } from "@/hooks/use-catalog";
import { userHasRole } from "@/lib/auth/permissions";
import { getShortLocationName } from "@/lib/geocoding";
import { orgRoute } from "@/lib/routes";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useAuthStore } from "@/store/auth";
import { useCartStore } from "@/store/cart";
import { useDiningModeStore } from "@/store/dining-mode";

interface SiteHeaderProps {
  onMenuClick?: () => void;
}

type SearchCategory = {
  id: string;
  name: string;
  label: string;
  emoji?: string;
};

type SearchOutlet = {
  id: string;
  name: string;
  address: string;
  distance?: string;
};

/**
 * Search categories for multi-business ordering platform.
 * Top categories shown in search dropdown - matching Uber Eats style.
 */
const searchCategories: SearchCategory[] = [
  { id: "pizza", name: "pizza", label: "Pizza", emoji: "🍕" },
  { id: "grocery", name: "grocery", label: "Grocery", emoji: "🥬" },
  { id: "chicken", name: "chicken", label: "Chicken", emoji: "🍗" },
  { id: "sushi", name: "sushi", label: "Sushi", emoji: "🍣" },
  { id: "fast-food", name: "fast-food", label: "Fast Food", emoji: "🍟" },
  { id: "chinese", name: "chinese", label: "Chinese", emoji: "🥡" },
  { id: "indian", name: "indian", label: "Indian", emoji: "🍛" },
];


import { useTenantBranding } from "@/providers/branding-provider";

export function SiteHeader({ onMenuClick }: SiteHeaderProps) {
  const orgSlug = useOrgSlug();
  const router = useRouter();
  const { getServiceTitle, tenant } = useTenantBranding();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchTab, setActiveSearchTab] = useState("all");

  // Store state
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const cartItems = useCartStore((state) => state.items);
  const { data: outletsData } = useOutlets(orgSlug, undefined, 1, 10);
  const displayName = getServiceTitle('OrderApp');
  const displayLogo = tenant?.logoUrl || brand.assets.logo;
  const outlets: SearchOutlet[] = (outletsData?.data ?? []).map((o) => ({
    id: o.id,
    name: o.name,
    address: o.address,
  }));

  // Dining mode state
  const diningMode = useDiningModeStore((state) => state.mode);
  const deliveryLocation = useDiningModeStore((state) => state.deliveryLocation);
  const setDeliveryLocation = useDiningModeStore((state) => state.setDeliveryLocation);
  const isScheduled = useDiningModeStore((state) => state.isScheduled);

  // Location display
  const locationDisplay = useMemo(() => {
    if (diningMode === "pickup") {
      return "Map location";
    }
    return deliveryLocation?.address || "Select location";
  }, [diningMode, deliveryLocation]);

  const timeDisplay = useMemo(() => {
    if (diningMode === "pickup") {
      return isScheduled ? "Scheduled" : "Pick up now";
    }
    return isScheduled ? "Scheduled" : "Now";
  }, [diningMode, isScheduled]);

  // Request geolocation on mount
  useEffect(() => {
    if ("geolocation" in navigator && !deliveryLocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const locationName = await getShortLocationName(latitude, longitude);
          setDeliveryLocation({
            address: locationName,
            latitude,
            longitude,
          });
        },
        (error) => {
          console.log("Geolocation error:", error);
        },
      );
    }
  }, [deliveryLocation, setDeliveryLocation]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex h-16 w-full max-w-full items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4 md:px-6 lg:px-8">
        {/* Left: Hamburger + Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Open menu"
            onClick={() => onMenuClick?.()}
          >
            <MenuIcon className="size-5" />
          </button>
          <Link
            href={orgRoute(orgSlug, "/")}
            className="flex items-center gap-2 text-sm font-bold text-foreground sm:text-base"
          >
            <Image
              src={displayLogo}
              alt={`${displayName} logo`}
              width={28}
              height={28}
              className="h-7 w-7 rounded-full object-cover"
              priority
            />
            <span className="hidden sm:inline">{displayName}</span>
          </Link>
        </div>

        {/* Center: Delivery/Pickup Toggle + Location + Search (Desktop) */}
        <div className="hidden flex-1 items-center gap-2 md:flex md:max-w-3xl lg:max-w-4xl lg:gap-3">
          {/* Delivery/Pickup Toggle */}
          <DiningModeToggle size="sm" />

          {/* Location Selector */}
          <button
            onClick={() => setLocationDialogOpen(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-muted/50 px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            <MapPin className="size-4 text-muted-foreground" />
            <span className="max-w-[140px] truncate">{locationDisplay}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">{timeDisplay}</span>
            <ChevronDown className="size-3 text-muted-foreground" />
          </button>

          {/* Search Bar */}
          <Popover open={searchOpen} onOpenChange={setSearchOpen}>
            <PopoverTrigger asChild>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  placeholder={`Search ${displayName}`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  className="w-full rounded-full border border-border bg-muted/30 py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  aria-label="Search"
                />
              </div>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[400px] p-0" sideOffset={8}>
              <Tabs
                defaultValue="all"
                value={activeSearchTab}
                onValueChange={setActiveSearchTab}
                className="w-full"
              >
                <TabsList className="w-full justify-start gap-0 rounded-none border-b border-border bg-background p-0">
                  <TabsTrigger
                    value="all"
                    className="rounded-none border-b-2 border-transparent px-4 py-3 text-sm data-[state=active]:border-foreground data-[state=active]:shadow-none"
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger
                    value="outlets"
                    className="rounded-none border-b-2 border-transparent px-4 py-3 text-sm data-[state=active]:border-foreground data-[state=active]:shadow-none"
                  >
                    Outlets
                  </TabsTrigger>
                  <TabsTrigger
                    value="grocery"
                    className="rounded-none border-b-2 border-transparent px-4 py-3 text-sm data-[state=active]:border-foreground data-[state=active]:shadow-none"
                  >
                    Grocery
                  </TabsTrigger>
                  <TabsTrigger
                    value="alcohol"
                    className="rounded-none border-b-2 border-transparent px-4 py-3 text-sm data-[state=active]:border-foreground data-[state=active]:shadow-none"
                  >
                    Alcohol
                  </TabsTrigger>
                </TabsList>

                {/* All Tab - Top Categories */}
                <TabsContent value="all" className="m-0 p-4">
                  <p className="mb-3 text-sm font-medium text-muted-foreground">Top categories</p>
                  <div className="space-y-0">
                    {searchCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => {
                          router.push(orgRoute(orgSlug, `/catalog?category=${category.id}`));
                          setSearchOpen(false);
                        }}
                        className="flex w-full items-center gap-4 py-3 text-sm transition hover:bg-muted/50"
                      >
                        <span className="text-2xl">{category.emoji}</span>
                        <span className="font-medium text-foreground">{category.label}</span>
                      </button>
                    ))}
                  </div>
                </TabsContent>

                {/* Outlets Tab */}
                <TabsContent value="outlets" className="m-0 p-4">
                  <p className="mb-3 text-sm font-medium text-muted-foreground">Nearby outlets</p>
                  {outlets.length > 0 ? (
                    <div className="space-y-0">
                      {outlets.map((outlet) => (
                        <button
                          key={outlet.id}
                          onClick={() => {
                            router.push(orgRoute(orgSlug, `/outlet/${outlet.id}`));
                            setSearchOpen(false);
                          }}
                          className="flex w-full items-start justify-between py-3 text-left text-sm transition hover:bg-muted/50"
                        >
                          <div>
                            <p className="font-medium text-foreground">{outlet.name}</p>
                            <p className="text-xs text-muted-foreground">{outlet.address}</p>
                          </div>
                          {outlet.distance && (
                            <span className="text-xs text-muted-foreground">{outlet.distance}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No outlets found nearby
                    </p>
                  )}
                </TabsContent>

                {/* Grocery Tab */}
                <TabsContent value="grocery" className="m-0 p-4">
                  <p className="mb-3 text-sm font-medium text-muted-foreground">
                    Grocery & Essentials
                  </p>
                  <div className="space-y-0">
                    {[
                      { label: "Fresh Produce", emoji: "🥬" },
                      { label: "Dairy & Eggs", emoji: "🥛" },
                      { label: "Meat & Fish", emoji: "🥩" },
                      { label: "Bakery", emoji: "🍞" },
                      { label: "Beverages", emoji: "🥤" },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => {
                          router.push(
                            orgRoute(orgSlug, `/catalog?category=grocery&sub=${item.label.toLowerCase().replace(/ & /g, "-")}`),
                          );
                          setSearchOpen(false);
                        }}
                        className="flex w-full items-center gap-4 py-3 text-sm transition hover:bg-muted/50"
                      >
                        <span className="text-2xl">{item.emoji}</span>
                        <span className="font-medium text-foreground">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </TabsContent>

                {/* Alcohol Tab */}
                <TabsContent value="alcohol" className="m-0 p-4">
                  <p className="mb-3 text-sm font-medium text-muted-foreground">Drinks & Alcohol</p>
                  <div className="space-y-0">
                    {[
                      { label: "Beer", emoji: "🍺" },
                      { label: "Wine", emoji: "🍷" },
                      { label: "Spirits", emoji: "🥃" },
                      { label: "Ready to Drink", emoji: "🍹" },
                      { label: "Non-Alcoholic", emoji: "🧃" },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => {
                          router.push(
                            orgRoute(orgSlug, `/catalog?category=alcohol&sub=${item.label.toLowerCase().replace(/ /g, "-")}`),
                          );
                          setSearchOpen(false);
                        }}
                        className="flex w-full items-center gap-4 py-3 text-sm transition hover:bg-muted/50"
                      >
                        <span className="text-2xl">{item.emoji}</span>
                        <span className="font-medium text-foreground">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </PopoverContent>
          </Popover>
        </div>

        {/* Right: Theme + Cart + Auth */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Mobile Search Button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="inline-flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
            aria-label="Search"
          >
            <Search className="size-5" />
          </button>

          <ThemeToggle />

          {/* Cart Button */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative inline-flex size-11 items-center justify-center rounded-full border border-border bg-background hover:bg-muted"
            aria-label="Open cart"
          >
            <ShoppingCart className="size-5" />
            {cartItems.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 inline-flex size-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {cartItems.length}
              </span>
            )}
          </button>

          {/* Auth Buttons */}
          {user ? (
            <div className="hidden items-center gap-1 sm:flex">
              <Button variant="ghost" size="sm" asChild>
                <Link href={orgRoute(orgSlug, userHasRole(user, ["staff", "admin", "superuser", "member"]) ? "/dashboard/staff" : "/dashboard/customer")}>
                  <LayoutDashboard className="size-4" />
                  <span className="hidden lg:inline">Dashboard</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href={orgRoute(orgSlug, "/profile")}>
                  <UserIcon className="size-4" />
                  <span className="hidden lg:inline">Account</span>
                </Link>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => void logout()}>
                <LogOut className="size-4" />
              </Button>
            </div>
          ) : (
            <Button size="sm" asChild className="hidden sm:inline-flex">
              <Link href={orgRoute(orgSlug, "/auth")}>
                <LogIn className="size-4 sm:mr-1" />
                <span className="hidden sm:inline">Sign in</span>
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile: Delivery/Pickup + Location Row */}
      <div className="flex items-center gap-1.5 border-t border-border px-3 py-1 md:hidden">
        <DiningModeToggle size="sm" />
        <button
          onClick={() => setLocationDialogOpen(true)}
          className="flex min-h-[40px] flex-1 items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1.5 text-xs font-medium active:bg-muted"
        >
          <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{locationDisplay}</span>
          <span className="text-muted-foreground">•</span>
          <span className="shrink-0 text-muted-foreground">{timeDisplay}</span>
        </button>
      </div>

      {/* Location Dialog */}
      <LocationDialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen} />

      {/* Cart Drawer */}
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />

      {/* User Menu Drawer */}
      <UserMenuDrawer open={userMenuOpen} onOpenChange={setUserMenuOpen} />
    </header>
  );
}
