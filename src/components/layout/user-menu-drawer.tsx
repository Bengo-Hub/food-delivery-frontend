import {
  BarChart3,
  Bell,
  Car,
  CreditCard,
  ExternalLink,
  FileLock,
  Flower,
  Gauge,
  Heart,
  HelpCircle,
  Home,
  MapPin,
  Package,
  Pill,
  RotateCcw,
  Shield,
  ShoppingCart,
  Tag,
  User,
  Wine,
  X,
  Zap
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { TenantLogo } from "@/components/layout/tenant-logo";
import { brand } from "@/config/brand";
import { useBrandConfig } from "@/hooks/use-brand";
import { useOrderingConfig } from "@/hooks/use-ordering-config";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { useSubscription } from "@/hooks/use-subscription";
import { orgRoute } from "@/lib/routes";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useAuthStore } from "@/store/auth";
import { userCanAccess, userHasRole } from "@/lib/auth/permissions";

interface UserMenuDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserMenuDrawer({ open, onOpenChange }: UserMenuDrawerProps) {
  const orgSlug = useOrgSlug();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { data: brandConfig } = useBrandConfig();
  const { copy } = useOrderingConfig();
  const { hasFeature } = useSubscription();
  // Plan-gated nav entries (exempt tenants pass via hasFeature).
  const hasAnalytics = hasFeature("advanced_analytics");
  const hasWallet = hasFeature("wallet");
  const hasPromos = hasFeature("promo_codes");

  const handleLogout = () => {
    logout();
    onOpenChange(false);
  };

  const isPlatformOwner = !!(
    user?.is_platform_owner ||
    user?.isSuperUser ||
    user?.roles?.includes("superuser")
  );
  const hasStaffAccess = userHasRole(user, ["staff", "admin", "superuser", "manager"]);
  const canManageRefunds = userCanAccess(user, {
    roles: ["admin", "superuser"],
    permissions: ["ordering.orders.delete"],
    permissionOperator: "or",
  });
  const canViewSla = userCanAccess(user, {
    roles: ["admin", "superuser", "manager"],
    permissions: ["ordering.analytics.view"],
    permissionOperator: "or",
  });
  const canViewAnalytics = userCanAccess(user, {
    roles: ["admin", "superuser", "manager"],
    permissions: ["ordering.analytics.view"],
    permissionOperator: "or",
  });
  const canManageCompliance = userHasRole(user, ["admin", "superuser"]);
  const canManageIntegrations = userCanAccess(user, {
    roles: ["admin", "superuser", "manager"],
    permissions: ["ordering.config.manage"],
    permissionOperator: "or",
  });

  const handleClose = () => {
    onOpenChange(false);
  };

  const getUserName = () => {
    if (!user) return "Guest";
    const userData = user as { fullName?: string; name?: string; email?: string };
    return userData.fullName || userData.name || userData.email?.split("@")[0] || "User";
  };

  const getUserAvatar = () => {
    if (!user) return null;
    return (user as { avatarUrl?: string }).avatarUrl;
  };

  // Fall back to the generic platform mark — never a bundled tenant photo
  // (see branding-provider.tsx DEFAULT_BRAND comment for why).
  const menuLogo = brandConfig?.logoUrl || brand.assets.logo;

  const { canInstall, isInstalled, isIOS, promptInstall } = usePwaInstall();
  const handleInstallClick = async () => {
    if (isInstalled) {
      toast.success("Already installed — look for it on your home screen.");
      return;
    }
    if (isIOS) {
      toast.info('Tap the Share icon, then "Add to Home Screen" to install this app.');
      return;
    }
    if (!canInstall) {
      toast.info("Install isn't available on this browser yet — try Chrome or Edge.");
      return;
    }
    const accepted = await promptInstall();
    if (accepted) toast.success("Installed! Look for it on your home screen.");
  };

  // Navigation logic from sidebar
  const menuItems = [
    ...(isPlatformOwner
      ? [
        {
          icon: Shield,
          label: "Platform Admin",
          href: "/platform",
          highlight: true,
        },
      ]
      : []),
    ...(hasStaffAccess && !isPlatformOwner
      ? [
        {
          icon: Package,
          label: "Staff Dashboard",
          href: "/dashboard/staff",
        },
        {
          icon: Shield,
          label: "Roles & Permissions",
          href: "/dashboard/staff/roles",
        },
        {
          icon: Bell,
          label: "Notifications",
          href: "/dashboard/staff/notifications",
        },
        ...(canManageRefunds
          ? [
            {
              icon: RotateCcw,
              label: "Refunds",
              href: "/dashboard/staff/refunds",
            },
          ]
          : []),
        ...(canViewAnalytics && hasAnalytics
          ? [
            {
              icon: BarChart3,
              label: "Analytics",
              href: "/dashboard/staff/analytics",
            },
          ]
          : []),
        ...(canViewSla
          ? [
            {
              icon: Gauge,
              label: "SLA Performance",
              href: "/dashboard/staff/sla",
            },
          ]
          : []),
        ...(canManageCompliance
          ? [
            {
              icon: FileLock,
              label: "Compliance",
              href: "/dashboard/staff/compliance",
            },
          ]
          : []),
        ...(canManageIntegrations
          ? [
            {
              icon: MapPin,
              label: "Google Business",
              href: "/dashboard/staff/integrations",
            },
          ]
          : []),
      ]
      : []),
    {
      icon: Home,
      label: "Home",
      href: "/",
    },
    {
      icon: Package,
      label: "Orders",
      href: "/orders",
    },
    {
      icon: Heart,
      label: "Favorites",
      href: "/favorites", // Redirect to favorites page
    },
    ...(hasWallet
      ? [
        {
          icon: CreditCard,
          label: "Wallet",
          href: "/profile/wallet",
        },
      ]
      : []),
    {
      icon: HelpCircle,
      label: "Help",
      href: "https://ticketing.codevertexafrica.com",
      external: true,
    },
    {
      icon: Car,
      label: "Get a ride",
      href: `https://riderapp.codevertexafrica.com/${orgSlug}/request-ride`,
      external: true,
    },
    ...(hasPromos
      ? [
        {
          icon: Tag,
          label: "Promotions",
          href: "/promotions",
        },
      ]
      : []),
    // Category items moved from sidebar
    {
      icon: ShoppingCart,
      label: "Grocery",
      href: "/catalog?category=grocery",
    },
    {
      icon: Package,
      label: "Convenience",
      href: "/catalog?category=convenience",
    },
    {
      icon: Wine,
      label: "Alcohol",
      href: "/catalog?category=alcohol",
    },
    {
      icon: Pill,
      label: "Health",
      href: "/catalog?category=health",
    },
    {
      icon: Package,
      label: "Retail",
      href: "/catalog?category=retail",
    },
    {
      icon: Flower,
      label: "Flowers",
      href: "/catalog?category=flowers",
    },
    {
      icon: Zap,
      label: "Offers",
      href: "/catalog?filter=offers",
    },
  ];

  if (!open) return null;

  const avatarUrl = getUserAvatar();

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm transition-opacity" onClick={handleClose} aria-hidden />

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-[101] flex w-80 max-w-[85vw] flex-col bg-background shadow-2xl transition-transform duration-300 ease-in-out",
          "animate-in slide-in-from-left",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="User menu"
      >
        {/* Close Button & Logo */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <TenantLogo src={menuLogo} alt={brandConfig?.name || brand.name} className="h-9" />
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center justify-center rounded-full p-2 hover:bg-muted"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Header - Sign in / Profile Section */}
        <div className="px-5 py-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted overflow-hidden">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Profile"
                    width={56}
                    height={56}
                    className="size-full object-cover"
                  />
                ) : (
                  <User className="size-8 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-bold text-foreground">
                  {getUserName()}
                </h2>
                <Link
                  href={orgRoute(orgSlug, "/profile")}
                  onClick={handleClose}
                  className="text-sm font-medium text-brand-emphasis hover:underline"
                >
                  Manage account
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-2">
              <Button asChild className="h-14 w-full rounded-full bg-brand-emphasis text-lg font-bold text-white hover:bg-brand-emphasis/90" size="lg">
                <Link href={orgRoute(orgSlug, "/auth")} onClick={handleClose}>
                  Sign in
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto pt-2">
          <ul className="space-y-0.5">
            {menuItems.map((item, idx) => {
              const Icon = item.icon;
              const fullHref = item.external ? item.href : orgRoute(orgSlug, item.href);
              const active = pathname === fullHref || (item.href !== '/' && pathname.startsWith(fullHref.split('?')[0]));

              const content = (
                <div className="flex items-center gap-5 px-5 py-3 transition-colors hover:bg-muted/50">
                  <div className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full transition-colors",
                    active ? "bg-brand-emphasis/10 text-brand-emphasis" : "bg-transparent text-foreground"
                  )}>
                    <Icon className="size-6" />
                  </div>
                  <span className={cn(
                    "text-base font-semibold",
                    active ? "text-brand-emphasis" : "text-foreground"
                  )}>
                    {item.label}
                  </span>
                  {item.external && <ExternalLink className="ml-auto size-4 text-muted-foreground" />}
                </div>
              );

              return (
                <li key={idx}>
                  {item.external ? (
                    <a href={item.href} target="_blank" rel="noopener noreferrer" onClick={handleClose}>
                      {content}
                    </a>
                  ) : (
                    <Link href={fullHref} onClick={handleClose}>
                      {content}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="my-4 h-px bg-border mx-5" />

          {/* Footer Items */}
          <ul className="space-y-1 py-2">
            <li>
              <Link href={orgRoute(orgSlug, "/business")} onClick={handleClose} className="block px-5 py-2 text-sm font-medium text-foreground hover:underline">
                Create a business account
              </Link>
            </li>
            <li>
              <Link href={orgRoute(orgSlug, "/add-outlet")} onClick={handleClose} className="block px-5 py-2 text-sm font-medium text-foreground hover:underline">
                {copy.addOutletCTA}
              </Link>
            </li>
            <li>
              <a href={`https://riderapp.codevertexafrica.com/join?org=${orgSlug}`} target="_blank" rel="noopener noreferrer" onClick={handleClose} className="block px-5 py-2 text-sm font-medium text-foreground hover:underline">
                Sign up to deliver
              </a>
            </li>
          </ul>

          {user && (
            <div className="mt-2 px-5 py-3">
              <button
                onClick={handleLogout}
                className="text-sm font-bold text-brand-emphasis hover:underline"
              >
                Sign out
              </button>
            </div>
          )}
        </nav>

        {/* App Download Section — this is a PWA, not a native app; every control here
            triggers the same install prompt (or iOS "Add to Home Screen" instructions),
            no App Store/Play Store listings exist. */}
        <div className="border-t border-border bg-muted/30 px-5 py-6">
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex w-full items-center gap-4 text-left"
          >
            <div className="flex size-14 items-center justify-center rounded-2xl bg-foreground shadow-lg p-2">
              <TenantLogo src={menuLogo} alt={brand.name} className="h-full" />
            </div>
            <div>
              <p className="text-base font-bold">There&apos;s more to love</p>
              <p className="text-sm text-muted-foreground">
                {isInstalled ? "Already installed on this device." : "Install the app for a faster experience."}
              </p>
            </div>
          </button>
          <div className="mt-5 flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className="h-auto flex-1 rounded-full border-border bg-background px-4 py-2 shadow-sm transition-all hover:shadow-md"
              asChild
            >
              <button type="button" onClick={handleInstallClick} className="gap-2">
                <svg className="size-6 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                <span className="text-left text-xs font-bold leading-tight">
                  <span className="block text-[9px] font-normal text-muted-foreground">Download on the</span>
                  App Store
                </span>
              </button>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-auto flex-1 rounded-full border-border bg-background px-4 py-2 shadow-sm transition-all hover:shadow-md"
              asChild
            >
              <button type="button" onClick={handleInstallClick} className="gap-2">
                <svg className="size-6 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-1.4l2.584 1.496c.906.524.906 1.87 0 2.394l-2.584 1.496-2.549-2.549 2.549-2.838zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
                </svg>
                <span className="text-left text-xs font-bold leading-tight">
                  <span className="block text-[9px] font-normal text-muted-foreground">Get it on</span>
                  Google Play
                </span>
              </button>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
