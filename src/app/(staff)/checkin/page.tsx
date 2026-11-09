import type { Metadata } from "next";
import { GateScannerEntry } from "@/modules/checkin/components/gate-scanner-entry";

export const metadata: Metadata = { title: "Gate check-in", robots: { index: false } };

export default function Page() {
  return <GateScannerEntry />;
}
