"use client";

import { Loader2, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PromoCodeSectionProps {
  code: string;
  message: string;
  discount: number;
  isPending: boolean;
  onCodeChange: (value: string) => void;
  onApply: () => void;
}

export function PromoCodeSection({
  code,
  message,
  discount,
  isPending,
  onCodeChange,
  onApply,
}: PromoCodeSectionProps) {
  return (
    <section className="rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Tag className="size-4 text-primary" />
        <span>Promo Code</span>
      </div>
      <div className="mt-3 flex gap-2">
        <Input
          placeholder="Enter code"
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          className="min-h-[44px]"
        />
        <Button
          variant="outline"
          onClick={onApply}
          disabled={isPending}
          className="min-h-[44px] shrink-0"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : "Apply"}
        </Button>
      </div>
      {message && (
        <p className={`mt-2 text-xs ${discount > 0 ? "text-green-600" : "text-destructive"}`}>
          {message}
        </p>
      )}
    </section>
  );
}
