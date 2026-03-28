import { redirect } from "next/navigation";

export default function MenuItemRedirect({ params }: { params: { orgSlug: string; id: string } }) {
  redirect(`/${params.orgSlug}/catalog/${params.id}`);
}
