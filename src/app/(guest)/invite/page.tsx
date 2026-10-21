import type { Metadata } from "next";

import { PagePlaceholder } from "@/modules/shared/components/page-placeholder";

export const metadata: Metadata = { title: "Invitation" };

export default function InvitePage() {
  return (
    <PagePlaceholder
      eyebrow="Invitations"
      title="Your invitation"
      description="Personal invitation links, RSVP and plus-ones. Coming soon."
    />
  );
}
