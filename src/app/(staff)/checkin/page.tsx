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
      description="Scan guest QR codes, even offline. Coming soon."
    />
  );
}
