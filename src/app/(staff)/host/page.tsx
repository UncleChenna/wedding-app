import type { Metadata } from "next";
import { HostScreen } from "@/modules/ordering/components/host-screen";

export const metadata: Metadata = { title: "Your tables", robots: { index: false } };

export default function Page() {
  return <HostScreen />;
}
