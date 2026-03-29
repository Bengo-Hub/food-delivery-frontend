import { BrandThemeSync } from "@/components/layout/brand-theme-sync";
import { SubscriptionBanner } from "@/components/subscription/subscription-banner";
import { MapProviderWrapper } from "@/providers/map-provider-wrapper";
import { OrgSlugProvider } from "@/providers/org-slug-provider";

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
      <SubscriptionBanner />
      <MapProviderWrapper>{children}</MapProviderWrapper>
    </OrgSlugProvider>
  );
}
