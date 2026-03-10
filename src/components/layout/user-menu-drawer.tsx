"use client";

import {
  Car,
  CreditCard,
  ExternalLink,
  Heart,
  HelpCircle,
  Package,
  Shield,
  Smartphone,
  Tag,
  User,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { brand } from "@/config/brand";
import { orgRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useAuthStore } from "@/store/auth";

interface UserMenuDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Custom icon component for subscription (circle with 1)
function SubscriptionIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v8M12 8l-2 2" />
    </svg>
  );
}

export function UserMenuDrawer({ open, onOpenChange }: UserMenuDrawerProps) {
  const orgSlug = useOrgSlug();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    onOpenChange(false);
  };

  const isPlatformOwner = orgSlug === 'codevertex';
  const hasStaffAccess = user && (user as any).roles?.some((r: string) => ["staff", "admin", "superuser", "super_admin"].includes(r));

  const handleClose = () => {
    onOpenChange(false);
  };

  // Get user display info with proper typing
  const getUserName = () => {
    if (!user) return "Guest";
    const userData = user as { fullName?: string; name?: string; email?: string };
    return userData.fullName || userData.name || userData.email?.split("@")[0] || "User";
  };

  const getUserAvatar = () => {
    if (!user) return null;
    return (user as { avatarUrl?: string }).avatarUrl;
  };

  // Main menu items - Uber Eats style
  const menuItems = [
    ...(isPlatformOwner
      ? [
          {
            icon: Shield,
            label: "Platform Admin",
            href: orgRoute(orgSlug, "/platform"),
            description: "Global System Management",
            highlight: true,
          },
        ]
      : []),
    ...(hasStaffAccess && !isPlatformOwner
      ? [
          {
            icon: Package,
            label: "Staff Dashboard",
            href: orgRoute(orgSlug, "/dashboard/staff"),
            description: "Manage orders and queue",
          },
        ]
      : []),
    {
      icon: Package,
      label: "Orders",
      href: orgRoute(orgSlug, "/orders"),
    },
    {
      icon: Heart,
      label: "Favorites",
      href: orgRoute(orgSlug, "/favorites"),
    },
    {
      icon: CreditCard,
      label: "Wallet",
      href: orgRoute(orgSlug, "/wallet"),
    },
    {
      icon: HelpCircle,
      label: "Help",
      href: orgRoute(orgSlug, "/help"),
    },
    {
      icon: Car,
      label: "Get a ride",
      href: "https://www.uber.com",
      external: true,
    },
    {
      icon: Tag,
      label: "Promotions",
      href: orgRoute(orgSlug, "/promotions"),
    },
    {
      icon: SubscriptionIcon,
      label: `${brand.shortName} One`,
      href: orgRoute(orgSlug, "/subscription"),
      highlight: true,
      description: "Try free for 4 weeks",
    },
    {
      icon: Users,
      label: "Invite friends",
      href: orgRoute(orgSlug, "/referral"),
      description: "You get KES 25 off",
    },
  ];

  if (!open) return null;

  const avatarUrl = getUserAvatar();

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50" onClick={handleClose} aria-hidden />

      {/* Drawer - Left side slide in (Uber Eats style) */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-80 max-w-[85vw] flex-col bg-background shadow-2xl",
          "duration-300 animate-in slide-in-from-left",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="User menu"
      >
        {/* Close Button */}
        <div className="flex items-center justify-end px-4 py-3">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center justify-center rounded-md p-1 hover:bg-muted"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Header - User Profile Section */}
        <div className="px-5 py-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Profile"
                    width={48}
                    height={48}
                    className="size-full rounded-full object-cover"
                  />
                ) : (
                  <User className="size-6 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-semibold text-foreground">
                  {getUserName()}
                </h2>
                <Link
                  href={orgRoute(orgSlug, "/profile")}
                  onClick={handleClose}
                  className="text-sm text-green-600 hover:underline"
                >
                  Manage account
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Button asChild className="w-full" size="lg">
                <Link href={orgRoute(orgSlug, "/auth")} onClick={handleClose}>
                  Sign in
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-0">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const content = (
                <>
                  <Icon className="size-5 shrink-0 text-foreground" />
                  <div className="min-w-0 flex-1">
                    <span
                      className={cn("text-sm font-medium", item.highlight && "text-foreground")}
                    >
                      {item.label}
                    </span>
                    {item.description && (
                      <p
                        className={cn(
                          "text-xs",
                          item.highlight ? "text-green-600" : "text-muted-foreground",
                        )}
                      >
                        {item.description}
                      </p>
                    )}
                  </div>
                  {item.external && <ExternalLink className="size-4 text-muted-foreground" />}
                </>
              );

              if (item.external) {
                return (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleClose}
                      className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted"
                    >
                      {content}
                    </a>
                  </li>
                );
              }

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={handleClose}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted"
                  >
                    {content}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Sign Out - as text link like in image */}
          {user && (
            <div className="mt-2 px-5 py-3">
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-green-600 hover:underline"
              >
                Sign out
              </button>
            </div>
          )}
        </nav>

        {/* Footer Links */}
        <div className="border-t border-border px-5 py-4">
          {/* Business Links */}
          <div className="space-y-3 text-sm">
            <Link
              href={orgRoute(orgSlug, "/business")}
              onClick={handleClose}
              className="block text-foreground hover:underline"
            >
              Create a business account
            </Link>
            <Link
              href={orgRoute(orgSlug, "/add-restaurant")}
              onClick={handleClose}
              className="block text-foreground hover:underline"
            >
              Add your restaurant
            </Link>
            <Link
              href={orgRoute(orgSlug, "/deliver")}
              onClick={handleClose}
              className="block text-foreground hover:underline"
            >
              Sign up to deliver
            </Link>
          </div>

          {/* App Download Section */}
          <div className="mt-4 border-t border-border pt-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-lg bg-foreground">
                <Image
                  src={brand.assets.logo}
                  alt={brand.name}
                  width={32}
                  height={32}
                  className="size-8 rounded object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-medium">There&apos;s more to love</p>
                <p className="text-xs text-muted-foreground">in the app.</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-1.5" asChild>
                <a href="#" onClick={(e) => e.preventDefault()}>
                  <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  iPhone
                </a>
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-1.5" asChild>
                <a href="#" onClick={(e) => e.preventDefault()}>
                  <Smartphone className="size-4" />
                  Android
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
