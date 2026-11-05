import type { Metadata } from "next";
import { LostLinkForm } from "@/modules/invitations/components/lost-link-form";

export const metadata: Metadata = {
  title: "Find your invitation",
  robots: { index: false, follow: false },
};
export default function LostLinkPage() {
  return <LostLinkForm />;
}
