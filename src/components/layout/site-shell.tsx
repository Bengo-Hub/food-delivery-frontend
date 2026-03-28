"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

import { MobileBottomNav } from "./mobile-bottom-nav";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { UserMenuDrawer } from "./user-menu-drawer";
import { PWAInstallPrompt } from "@/components/pwa/pwa-install-prompt";

type SiteShellProps = {
  children: React.ReactNode;
  className?: string;
  mainClassName?: string;
  /** Hide the mobile bottom navigation bar (e.g., on checkout) */
  hideBottomNav?: boolean;
  /** Hide the desktop sidebar (e.g., on checkout or auth pages) */
  hideSidebar?: boolean;
  /** Hide the footer (e.g., on full-screen map pages) */
  hideFooter?: boolean;
};

export function SiteShell({
  children,
  className,
  mainClassName,
  hideBottomNav,
  hideFooter,
  hideSidebar: _hideSidebar,
}: SiteShellProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <div
      className={cn(
        "flex min-h-[100dvh] flex-col bg-background text-foreground transition-colors duration-150 ease-out",
        className,
      )}
    >
      <SiteHeader onMenuClick={() => setUserMenuOpen(true)} />
      <div className="flex flex-1">
        {/* Main Content - extra bottom padding on mobile for bottom nav */}
        <main
          className={cn(
            "min-w-0 flex-1",
            !hideBottomNav && "pb-[72px] md:pb-0",
            mainClassName,
          )}
        >
          {children}
        </main>
      </div>
      {/* User Menu Drawer - Overlay */}
      <UserMenuDrawer open={userMenuOpen} onOpenChange={setUserMenuOpen} />
      {!hideFooter && <SiteFooter />}
      {/* Mobile bottom navigation */}
      {!hideBottomNav && <MobileBottomNav />}
      {/* PWA install prompt */}
      <PWAInstallPrompt />
    </div>
  );
}
