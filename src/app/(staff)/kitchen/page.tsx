import type { Metadata } from "next";

import { PagePlaceholder } from "@/modules/shared/components/page-placeholder";

export const metadata: Metadata = {
  title: "Kitchen & bar",
  robots: { index: false },
};

export default function KitchenPage() {
  return (
    <PagePlaceholder
      eyebrow="Staff"
      title="Kitchen & bar board"
      description="Live incoming orders for each station. Coming soon."
    />
  );
}
