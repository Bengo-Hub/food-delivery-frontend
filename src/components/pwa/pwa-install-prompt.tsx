"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { PwaInstallPrompt } from "@bengo-hub/shared-ui-lib/offline";

import { brand } from "@/config/brand";
import { useBrandConfig } from "@/hooks/use-brand";

const DISMISS_KEY = "pwa-install-dismissed";

/**
 * Keeps the browser's <link rel="manifest"> pointed at this tenant's manifest (correct
 * start_url + logo) instead of a generic one. Deliberately decoupled from the install-prompt
 * banner UI below — it must keep working regardless of which component renders the prompt.
 */
function useTenantManifestLink() {
  const params = useParams();
  const orgSlug = params?.orgSlug as string | undefined;

  useEffect(() => {
    if (!orgSlug) return;
    const href = `/${orgSlug}/manifest.webmanifest`;
    let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "manifest";
      document.head.appendChild(link);
    }
    if (link.href !== new URL(href, window.location.href).href) {
      link.href = href;
    }
  }, [orgSlug]);
}

/**
 * Thin wrapper around shared-ui-lib's fleet-wide `PwaInstallPrompt` (`offline` module), feeding
 * it this app's tenant branding. Replaces the previous fully-local implementation, which had
 * drifted from pos-ui/library-ui/inventory-ui's copies in delay timing, dismiss-window length
 * and card design — see shared-ui-lib's `pwa-install-prompt.tsx` docblock for the fleet-wide
 * rationale. The tenant-manifest-link swap above is unrelated to the prompt's own UI and is
 * kept local for that reason.
 */
export function PWAInstallPrompt() {
  useTenantManifestLink();
  const { data: brandConfig } = useBrandConfig();

  const appName = brandConfig?.name ? `${brandConfig.name} Ordering` : brand.shortName;

  return (
    <PwaInstallPrompt
      appName={appName}
      logoUrl={brandConfig?.logoUrl ?? null}
      tagline="Order faster with the installed app. Works offline too!"
      dismissKey={DISMISS_KEY}
    />
  );
}
