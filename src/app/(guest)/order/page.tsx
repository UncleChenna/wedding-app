import type { Metadata } from "next";

import { PagePlaceholder } from "@/modules/shared/components/page-placeholder";

export const metadata: Metadata = { title: "Order" };

export default function OrderPage() {
  return (
    <PagePlaceholder
      eyebrow="Table service"
      title="Order to your table"
      description="Enter your table number and order food and drinks. Coming soon."
    />
  );
}
