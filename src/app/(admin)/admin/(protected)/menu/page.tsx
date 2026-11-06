import type { Metadata } from "next";
import { AdminMenu } from "@/modules/admin/components/admin-menu";
export const metadata: Metadata = { title: "Menu", robots: { index: false, follow: false } };
export default function AdminMenuPage() {
  return <AdminMenu />;
}
