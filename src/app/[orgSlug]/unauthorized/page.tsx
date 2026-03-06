"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { orgRoute } from "@/lib/routes";
import { useOrgSlug } from "@/providers/org-slug-provider";

export default function UnauthorizedPage() {
  const orgSlug = useOrgSlug();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Access denied</h1>
      <p className="text-muted-foreground">You don’t have permission to view this area.</p>
      <div className="flex gap-2">
        <Button asChild variant="default">
          <Link href={orgRoute(orgSlug, "/")}>Go home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={orgRoute(orgSlug, "/menu")}>Menu</Link>
        </Button>
      </div>
    </div>
  );
}
