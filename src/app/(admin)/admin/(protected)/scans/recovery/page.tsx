import type { Metadata } from "next";
import { requireAdminPageAccess } from "@/modules/admin/server/current-admin-access";
import { ScanRecovery } from "@/modules/admin/components/scan-recovery";
export const metadata: Metadata = {
  title: "Recover gate records",
  robots: { index: false, follow: false },
};
export default async function ScanRecoveryPage() {
  await requireAdminPageAccess();
  return <ScanRecovery />;
}
