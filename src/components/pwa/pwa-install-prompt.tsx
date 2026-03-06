"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Share, X } from "lucide-react";
import Image from "next/image";

import { brand } from "@/config/brand";
import { useBrandConfig } from "@/hooks/use-brand";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed";
const DISMISS_DURATION = 30 * 60 * 1000; // 30 minutes — re-prompt if not installed
const RE_PROMPT_INTERVAL = 30 * 60 * 1000; // 30 minutes

function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true)
  );
}

function wasDismissedRecently(): boolean {
  if (typeof window === "undefined") return false;
  const dismissed = localStorage.getItem(DISMISS_KEY);
  if (!dismissed) return false;
  const ts = parseInt(dismissed, 10);
  return Date.now() - ts < DISMISS_DURATION;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);

  // Tenant branding with fallback to static config
  const { data: brandConfig } = useBrandConfig();
  const appName = brandConfig?.shortName || brand.shortName;
  const appLogo = brandConfig?.logoUrl || brand.assets.logo;

  useEffect(() => {
    // Don't show if already installed
    if (isStandalone()) return;

    // iOS devices: show custom guide after a short delay; re-show every 30 min if dismissed
    if (isIOS()) {
      const maybeShow = () => {
        if (!wasDismissedRecently()) setShowIOSGuide(true);
      };
      const timer = setTimeout(maybeShow, 3000);
      const interval = setInterval(maybeShow, RE_PROMPT_INTERVAL);
      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }

    // Chrome/Edge/Samsung: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      promptRef.current = event;
      setDeferredPrompt(event);
      if (!wasDismissedRecently()) setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Re-prompt at least once every 30 min if not installed and user had dismissed
    const recheck = () => {
      if (isStandalone()) return;
      if (!wasDismissedRecently() && promptRef.current) setShowBanner(true);
    };
    const interval = setInterval(recheck, RE_PROMPT_INTERVAL);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearInterval(interval);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    const prompt = promptRef.current ?? deferredPrompt;
    if (!prompt) return;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") {
      setShowBanner(false);
      setDeferredPrompt(null);
      promptRef.current = null;
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    setShowIOSGuide(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  }, []);

  // iOS share-sheet guide
  if (showIOSGuide && !isStandalone()) {
    return (
      <div
        className={cn(
          "fixed bottom-0 inset-x-0 z-50 safe-area-pb",
          "animate-in slide-in-from-bottom duration-300",
        )}
      >
        <div className="mx-3 mb-3 rounded-2xl border border-border bg-background p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Image
                src={appLogo}
                alt={appName}
                width={32}
                height={32}
                className="size-8 rounded-lg object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Install {appName}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Get the full app experience with faster loading and offline access.
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="shrink-0 rounded-full p-1.5 hover:bg-muted"
              aria-label="Dismiss"
            >
              <X className="size-4 text-muted-foreground" />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2.5">
            <Share className="size-5 text-primary" />
            <p className="text-xs text-muted-foreground">
              Tap <span className="font-semibold text-foreground">Share</span> then{" "}
              <span className="font-semibold text-foreground">Add to Home Screen</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Chrome/Edge install banner
  if (!showBanner || !deferredPrompt) return null;

  return (
    <div
      className={cn(
        "fixed bottom-0 inset-x-0 z-50 safe-area-pb",
        "animate-in slide-in-from-bottom duration-300",
      )}
    >
      <div className="mx-3 mb-3 rounded-2xl border border-border bg-background p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Image
              src={appLogo}
              alt={appName}
              width={32}
              height={32}
              className="size-8 rounded-lg object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Install {appName}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Order faster with the installed app. Works offline too!
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 rounded-full p-1.5 hover:bg-muted"
            aria-label="Dismiss"
          >
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleDismiss}
            className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
          >
            Not now
          </button>
          <button
            onClick={handleInstall}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Download className="size-4" />
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
