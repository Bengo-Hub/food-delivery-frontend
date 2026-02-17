import { redirect } from "next/navigation";

const DEFAULT_SLUG = process.env.NEXT_PUBLIC_TENANT_SLUG || "urban-loft";

export default function RootPage() {
  redirect(`/${DEFAULT_SLUG}`);
}
