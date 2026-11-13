import type { Metadata } from "next";
import { AdminTableCards } from "@/modules/admin/components/admin-table-cards";

export const metadata: Metadata = {
  title: "Table cards",
  robots: { index: false, follow: false },
};

export default function TableCardsPage() {
  return <AdminTableCards />;
}
