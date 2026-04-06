"use client";

import { LogIn, Mail, Star } from "lucide-react";

import { Button } from "@/components/ui/button";

interface CheckoutModeChooserProps {
  onChooseGuest: () => void;
  onChooseSignIn: () => void;
}

export function CheckoutModeChooser({ onChooseGuest, onChooseSignIn }: CheckoutModeChooserProps) {
  return (
    <div className="container mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-center text-2xl font-bold">How would you like to checkout?</h1>
      <div className="space-y-4">
        <button
          onClick={onChooseGuest}
          className="flex w-full items-center gap-4 rounded-xl border border-border p-4 text-left transition-colors hover:bg-muted/50 active:scale-[0.99]"
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="size-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Continue as Guest</p>
            <p className="text-sm text-muted-foreground">Quick checkout with just your email</p>
          </div>
        </button>

        <button
          onClick={onChooseSignIn}
          className="flex w-full items-center gap-4 rounded-xl border border-border p-4 text-left transition-colors hover:bg-muted/50 active:scale-[0.99]"
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <LogIn className="size-5 text-green-600" />
          </div>
          <div>
            <p className="font-semibold">Sign In</p>
            <p className="text-sm text-muted-foreground">Access saved addresses, order history & loyalty</p>
          </div>
        </button>

        <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
          <Star className="size-4 shrink-0 text-amber-500" />
          <span>Signed-in users earn loyalty points on every order!</span>
        </div>
      </div>
    </div>
  );
}
