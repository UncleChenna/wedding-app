import type { Metadata } from "next";
import { AdminRsvpHistory } from "@/modules/admin/components/admin-rsvp-history";
export const metadata: Metadata = {
  title: "Reply history",
  robots: { index: false, follow: false },
};
export default async function RsvpHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  return <AdminRsvpHistory id={(await params).id} />;
}
