"use client";

import { cn } from "@/lib/utils";
import { Flower, Home, Package, Pill, ShoppingCart, Wine, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { orgRoute } from "@/lib/routes";
import { useOrgSlug } from "@/providers/org-slug-provider";

const sidebarItems = [
  { id: "home", label: "Home", href: "/", icon: Home },
  { id: "grocery", label: "Grocery", href: "/menu?category=grocery", icon: ShoppingCart },
  { id: "convenience", label: "Convenience", href: "/menu?category=convenience", icon: Package },
  { id: "alcohol", label: "Alcohol", href: "/menu?category=alcohol", icon: Wine },
  { id: "health", label: "Health", href: "/menu?category=health", icon: Pill },
  { id: "retail", label: "Retail", href: "/menu?category=retail", icon: Package },
  { id: "flowers", label: "Flowers", href: "/menu?category=flowers", icon: Flower },
  { id: "offers", label: "Offers", href: "/menu?filter=offers", icon: Zap },
];

export function Sidebar() {
  const pathname = usePathname();
  const orgSlug = useOrgSlug();

  const isActive = (href: string) => {
    const fullPath = orgRoute(orgSlug, href);
    if (href === "/") {
      return pathname === fullPath || pathname === `/${orgSlug}`;
    }
    return pathname.startsWith(fullPath.split("?")[0]);
  };

  return (
    <aside className="hidden w-52 shrink-0 border-r border-border bg-background lg:block">
      <nav className="sticky top-16 flex max-h-[calc(100dvh-4rem)] flex-col gap-0 overflow-y-auto py-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.id}
              href={orgRoute(orgSlug, item.href)}
              className={cn(
                "flex min-h-[44px] items-center gap-3 border-l-4 px-4 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-muted text-foreground"
                  : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
