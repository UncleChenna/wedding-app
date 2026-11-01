import { appRoutes } from "@/modules/shared/lib/routes";
import type { Metadata } from "next";

import { PagePlaceholder } from "@/modules/shared/components/page-placeholder";

export const metadata: Metadata = {
  title: "Gate check-in",
  robots: { index: false },
};

export default function CheckinPage() {
  return (
    <PagePlaceholder
      eyebrow="Staff"
      title="Gate check-in"
      description="QR check-in is coming soon. For now, ask the gate lead to help welcome your guest."
      backTo={appRoutes.staff}
    />
  );
}
