import { SubscriptionBanner } from "@/components/subscription/subscription-banner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SubscriptionBanner />
      {children}
    </>
  );
}
