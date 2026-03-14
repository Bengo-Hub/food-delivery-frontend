"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  const [homeHref, setHomeHref] = useState("/");

  useEffect(() => {
    const pathSlug = window.location.pathname.split("/")[1];
    if (pathSlug && pathSlug !== "api" && pathSlug !== "auth") {
      setHomeHref(`/${pathSlug}`);
    }
  }, []);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">The page you’re looking for doesn’t exist or was moved.</p>
      <Button asChild variant="default">
        <Link href={homeHref}>Go home</Link>
      </Button>
    </div>
  );
}
