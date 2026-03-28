import { redirect } from "next/navigation";

export default function MenuRedirect({ params }: { params: { orgSlug: string } }) {
  redirect(`/${params.orgSlug}/catalog`);
}
