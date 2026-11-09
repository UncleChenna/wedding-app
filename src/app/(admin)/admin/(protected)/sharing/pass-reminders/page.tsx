import type { Metadata } from "next";
import { AdminPassReminders } from "@/modules/admin/components/admin-pass-reminders";
export const metadata: Metadata = {
  title: "Pass reminders",
  robots: { index: false, follow: false },
};
export default function PassRemindersPage() {
  return <AdminPassReminders />;
}
