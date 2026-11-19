import type { Metadata } from "next";
import { AdminTableCards } from "@/modules/admin/components/admin-table-cards";

export const metadata: Metadata = {
  title: "Printable table signs",
  robots: { index: false, follow: false },
};

export default function TableCardsPage() {
  return <AdminTableCards />;
}
