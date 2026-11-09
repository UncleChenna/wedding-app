import type { Metadata } from "next";
import { KitchenStation } from "@/modules/ordering/components/kitchen-station";

export const metadata: Metadata = { title: "Kitchen board", robots: { index: false } };

export default function Page() {
  return <KitchenStation />;
}
