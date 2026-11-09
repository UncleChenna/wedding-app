import type { Metadata } from "next";
import { AdminReminders } from "@/modules/admin/components/admin-reminders";
export const metadata: Metadata = { title: "Reminders", robots: { index: false, follow: false } };
export default function RemindersPage() {
  return <AdminReminders />;
}
