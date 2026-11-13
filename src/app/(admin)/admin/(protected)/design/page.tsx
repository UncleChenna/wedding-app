import type { Metadata } from "next";
import { AdminInvitationDesign } from "@/modules/admin/components/admin-invitation-design";
export const metadata: Metadata = {
  title: "Invitation design",
  robots: { index: false, follow: false },
};
export default function InvitationDesignPage() {
  return <AdminInvitationDesign />;
}
