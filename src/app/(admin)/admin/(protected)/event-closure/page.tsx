import type { Metadata } from "next";
import { AdminEventClosure } from "@/modules/admin/components/admin-event-closure";
export const metadata: Metadata = {
  title: "After the celebration",
  robots: { index: false, follow: false },
};
export default function EventClosurePage() {
  return <AdminEventClosure />;
}
