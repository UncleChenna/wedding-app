import type { Metadata } from "next";
import { OrderPreview } from "@/modules/ordering/components/order-preview";
import { listThemes } from "@/modules/theming";
export const metadata: Metadata = { title: "Table ordering preview", robots: { index: false } };
export default function OrderPreviewPage() {
  return <OrderPreview themes={listThemes()} />;
}
