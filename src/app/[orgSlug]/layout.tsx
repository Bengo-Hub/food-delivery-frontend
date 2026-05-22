import type { Metadata } from "next";
import { BrandThemeSync } from "@/components/layout/brand-theme-sync";
import { MapProviderWrapper } from "@/providers/map-provider-wrapper";
import { OrgSlugProvider } from "@/providers/org-slug-provider";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}): Promise<Metadata> {
  const { orgSlug } = await params;
  return {
    manifest: `/${orgSlug}/manifest.webmanifest`,
  };
}

export default async function OrgSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  return (
    <OrgSlugProvider orgSlug={orgSlug}>
      <BrandThemeSync />
      <MapProviderWrapper>{children}</MapProviderWrapper>
    </OrgSlugProvider>
  );
}
