import type { Metadata } from "next";
import { AdminHealth } from "@/modules/admin/components/admin-health";
export const metadata: Metadata = { title: "Event health", robots: { index: false } };
export default function AdminHealthPage() {
  return <AdminHealth />;
}
