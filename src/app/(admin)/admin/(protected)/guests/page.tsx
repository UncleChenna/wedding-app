import type { Metadata } from "next";
import { AdminGuestList } from "@/modules/admin/components/admin-guest-list";

export const metadata: Metadata = { title: "Guests", robots: { index: false, follow: false } };
export default function GuestsPage() {
  return <AdminGuestList />;
}
