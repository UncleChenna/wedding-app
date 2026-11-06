import type { Metadata } from "next";
import { AdminStaff } from "@/modules/admin/components/admin-staff";
export const metadata: Metadata = { title: "Staff", robots: { index: false, follow: false } };
export default function AdminStaffPage() {
  return <AdminStaff />;
}
