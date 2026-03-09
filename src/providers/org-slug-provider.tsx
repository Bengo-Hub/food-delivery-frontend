"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";

const OrgSlugContext = createContext<string>("");

export function useOrgSlug(): string {
  const slug = useContext(OrgSlugContext);
  // Return empty string during static generation when provider isn't available
  // Components should handle this gracefully with fallbacks
  return slug;
}

export function OrgSlugProvider({
  orgSlug,
  children,
}: {
  orgSlug: string;
  children: ReactNode;
}) {
  useEffect(() => {
    localStorage.setItem("tenantSlug", orgSlug);
  }, [orgSlug]);

  return (
    <OrgSlugContext.Provider value={orgSlug}>{children}</OrgSlugContext.Provider>
  );
}
