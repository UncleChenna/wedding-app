import type { Metadata } from "next";
import { AdminGuestList } from "@/modules/admin/components/admin-guest-list";

export const metadata: Metadata = { title: "Guests", robots: { index: false, follow: false } };
export default async function GuestsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string | string[] }>;
}) {
  const query = await searchParams;
  return <AdminGuestList draftDeleted={query.notice === "draft-deleted"} />;
}
