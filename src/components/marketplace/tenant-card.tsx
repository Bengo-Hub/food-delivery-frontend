"use client";

import Link from "next/link";

import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { normalizeOrderingUseCase } from "@/lib/use-case-config";
import { getUseCaseCopy } from "@/lib/use-case-copy";
import { cn } from "@/lib/utils";
import type { MarketplaceTenant } from "@/lib/api/marketplace";

interface TenantCardProps {
  tenant: MarketplaceTenant;
  /** Query string (already encoded, no leading "?") appended to the /{slug} link — e.g. carrying location. */
  linkQuery?: string;
  className?: string;
}

/**
 * A single tenant's preview card on the platform marketplace landing page (root, no slug).
 * Deliberately store-level, not outlet/product-level — deep outlet/product previews stay on the
 * tenant's own `/{slug}` storefront once clicked through.
 */
export function TenantCard({ tenant, linkQuery, className }: TenantCardProps) {
  const profile = normalizeOrderingUseCase(tenant.useCase);
  const copy = getUseCaseCopy(tenant.useCase);
  const href = `/${tenant.slug}${linkQuery ? `?${linkQuery}` : ""}`;

  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg",
        className,
      )}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        <ImageWithFallback
          src={tenant.logoUrl}
          alt={tenant.name}
          useCase={profile}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          iconClassName="size-10"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <h3 className="line-clamp-1 text-sm font-semibold text-foreground sm:text-base">
          {tenant.name}
        </h3>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {copy.outletLabel}
          </span>
          {tenant.country && (
            <span className="text-[11px] text-muted-foreground">{tenant.country}</span>
          )}
        </div>
        <span className="mt-auto pt-1 text-xs font-medium text-primary group-hover:underline">
          Visit store &rarr;
        </span>
      </div>
    </Link>
  );
}

export function TenantCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="aspect-[16/9] w-full animate-pulse bg-muted" />
      <div className="space-y-2 p-3 sm:p-4">
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
