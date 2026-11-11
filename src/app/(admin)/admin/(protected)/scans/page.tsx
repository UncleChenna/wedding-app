import type { Metadata } from "next";
import { AdminScanLog } from "@/modules/admin/components/admin-scan-log";

export const metadata: Metadata = { title: "Scan log", robots: { index: false, follow: false } };
export default async function ScanLogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <AdminScanLog query={await searchParams} />;
}
