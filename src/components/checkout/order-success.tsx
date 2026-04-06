"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { orgRoute } from "@/lib/routes";
import { useOrgSlug } from "@/providers/org-slug-provider";

interface OrderSuccessProps {
  orderId: string;
}

export function OrderSuccess({ orderId }: OrderSuccessProps) {
  const orgSlug = useOrgSlug();
  const logisticsUrl =
    process.env.NEXT_PUBLIC_LOGISTICS_UI_URL ?? "https://logistics.codevertexitsolutions.com";

  return (
    <div className="flex flex-col items-center gap-6 py-12 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
        <CheckCircle2 className="size-10 text-green-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold">Order Placed!</h2>
        <p className="mt-2 text-muted-foreground">
          Payment confirmed. You can track your order below.
        </p>
      </div>
      <div className="w-full max-w-xs space-y-3">
        <Button asChild className="w-full">
          <a href={`${logisticsUrl}/${orgSlug}/tracking?orderId=${encodeURIComponent(orderId)}`}>
            Track Your Order
          </a>
        </Button>
        <Button variant="outline" asChild className="w-full">
          <Link href={orgRoute(orgSlug, "/catalog")}>Continue Browsing</Link>
        </Button>
      </div>
    </div>
  );
}
