import type { Metadata } from "next";
import { AdminSharing } from "@/modules/admin/components/admin-sharing";
export const metadata: Metadata = { title: "Sharing", robots: { index: false, follow: false } };
export default function SharingPage() {
  return <AdminSharing />;
}
