import type { Metadata } from "next";
import { AdminDashboard } from "@/modules/admin/components/admin-dashboard";
export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export default function AdminPage() {
  return <AdminDashboard />;
}
