import type { Metadata } from "next";
import { AdminSettings } from "@/modules/admin/components/admin-settings";
export const metadata: Metadata = {
  title: "Event settings",
  robots: { index: false, follow: false },
};
export default function AdminSettingsPage() {
  return <AdminSettings />;
}
