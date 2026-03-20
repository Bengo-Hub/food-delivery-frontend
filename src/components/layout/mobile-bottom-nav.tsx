"use client";

import { Home, Search, ShoppingCart, ClipboardList, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { orgRoute } from "@/lib/routes";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useCartStore } from "@/store/cart";
import { useAuthStore } from "@/store/auth";

const navItems = [
  { id: "home", label: "Home", icon: Home, href: "/" },
  { id: "menu", label: "Browse", icon: Search, href: "/menu" },
  { id: "cart", label: "Cart", icon: ShoppingCart, href: "/cart" },
  { id: "orders", label: "Orders", icon: ClipboardList, href: "/orders" },
  { id: "account", label: "Account", icon: User, href: "/profile" },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const orgSlug = useOrgSlug();
  const cartItems = useCartStore((s) => s.items);
  const user = useAuthStore((s) => s.user);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const isActive = (href: string) => {
    const fullPath = orgRoute(orgSlug, href);
    if (href === "/") return pathname === fullPath || pathname === `/${orgSlug}`;
    return pathname.startsWith(fullPath);
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm md:hidden safe-area-pb safe-area-px"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around px-1 sm:px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const href =
            item.id === "account" && !user
              ? orgRoute(orgSlug, "/auth")
              : orgRoute(orgSlug, item.href);

          return (
            <Link
              key={item.id}
              href={href}
              className={cn(
                "relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <span className="relative">
                <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
                {item.id === "cart" && cartCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 inline-flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </span>
              <span>{item.label}</span>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
