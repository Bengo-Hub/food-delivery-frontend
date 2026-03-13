"use client";

import { useTenantBranding } from "@/providers/branding-provider";
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
  const { tenant } = useTenantBranding();

  const isActive = (href: string) => {
    const fullPath = orgRoute(orgSlug, href);
    if (href === "/") {
      return pathname === fullPath || pathname === `/${orgSlug}`;
    }
    return pathname.startsWith(fullPath.split("?")[0]);
  };

  return (
    <aside className="hidden w-56 shrink-0 border-r border-border bg-brand-dark text-brand-light lg:block">
      <nav className="sticky top-16 flex max-h-[calc(100dvh-4rem)] flex-col gap-1 overflow-y-auto py-6 px-3">
        <div className="px-4 mb-8">
          {tenant?.logoUrl ? (
            <img src={tenant.logoUrl} alt={tenant.name} className="h-10 w-auto object-contain" />
          ) : (
            <div className="w-10 h-10 bg-brand-orange rounded-xl flex items-center justify-center shadow-glow-orange">
              <ShoppingCart className="text-white h-6 w-6" />
            </div>
          )}
        </div>

        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.id}
              href={orgRoute(orgSlug, item.href)}
              className={cn(
                "group flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300",
                active 
                  ? "bg-brand-orange text-white shadow-glow-orange" 
                  : "opacity-70 hover:opacity-100 hover:bg-white/5"
              )}
            >
              <Icon className={cn("h-5 w-5", active ? "text-white" : "text-brand-beige")} />
              <span className="font-bold tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
