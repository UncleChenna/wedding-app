import { appRoutes } from "@/modules/shared/lib/routes";
import type { Metadata } from "next";

import { PagePlaceholder } from "@/modules/shared/components/page-placeholder";

export const metadata: Metadata = {
  title: "Kitchen board",
  robots: { index: false },
};

export default function KitchenPage() {
  return (
    <PagePlaceholder
      eyebrow="Staff"
      title="Kitchen board"
      description="The food board is coming soon. For now, check orders with your station lead."
      backTo={appRoutes.staff}
    />
  );
}
