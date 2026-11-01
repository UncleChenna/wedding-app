import type { Metadata } from "next";
import { PagePlaceholder } from "@/modules/shared/components/page-placeholder";
import { appRoutes } from "@/modules/shared/lib/routes";
export const metadata: Metadata = { title: "Bar board", robots: { index: false } };
export default function BarPage() {
  return (
    <PagePlaceholder
      eyebrow="Staff"
      title="Bar board"
      description="The drinks board is coming soon. For now, check orders with your station lead."
      backTo={appRoutes.staff}
    />
  );
}
