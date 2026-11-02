import type { Metadata } from "next";

import { PagePlaceholder } from "@/modules/shared/components/page-placeholder";

export const metadata: Metadata = { title: "Order" };

export default function OrderPage() {
  return (
    <PagePlaceholder
      eyebrow="Table service"
      title="Order to your table"
      description="Table ordering is coming soon. For now, ask a member of the team for food or drinks."
    />
  );
}
