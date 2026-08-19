"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

/**
 * Independent `beforeinstallprompt` capture for imperative install triggers (e.g. the sidebar's
 * "download app" badges) — separate from, but compatible with, the shared PwaInstallPrompt
 * banner (`@bengo-hub/shared-ui-lib/offline`), which has no exported imperative trigger of its
 * own. Both listen to the same browser event independently; only one needs to call `.prompt()`.
 */
export function usePwaInstall() {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const ios = isIOS();

  useEffect(() => {
    setIsInstalled(isStandalone());

    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };
    const onInstalled = () => {
      deferredPrompt.current = null;
      setCanInstall(false);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  /** Triggers the native install prompt. Returns false when there's nothing to prompt
   *  (already installed, or the browser hasn't fired beforeinstallprompt yet/at all — e.g.
   *  iOS Safari never fires it, so callers should show manual instructions there instead). */
  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt.current) return false;
    await deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    deferredPrompt.current = null;
    setCanInstall(false);
    return outcome === "accepted";
  }, []);

  return { canInstall, isInstalled, isIOS: ios, promptInstall };
}
