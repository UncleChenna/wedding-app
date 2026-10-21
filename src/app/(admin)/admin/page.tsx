import type { Metadata } from "next";

import { PagePlaceholder } from "@/modules/shared/components/page-placeholder";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default function AdminPage() {
  return (
    <PagePlaceholder
      eyebrow="Admin"
      title="Wedding control room"
      description="Guest list, seating, menu and the live dashboard. Coming soon."
    />
  );
}
