import type { Metadata } from "next";
import { AdminGatePrint } from "@/modules/admin/components/admin-gate-print";
export const metadata: Metadata = {
  title: "Gate guest list",
  robots: { index: false, follow: false },
};
export default function GatePrintPage() {
  return <AdminGatePrint />;
}
