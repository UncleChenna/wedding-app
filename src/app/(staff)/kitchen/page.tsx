import type { Metadata } from "next";
import { StationScreen } from "@/modules/ordering/components/station-screen";

export const metadata: Metadata = { title: "Kitchen board", robots: { index: false } };

export default function Page() {
  return <StationScreen station="kitchen" />;
}
