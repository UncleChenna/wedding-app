import type { Metadata } from "next";
import { AdminInvitationEditor } from "@/modules/admin/components/admin-invitation-editor";
export const metadata: Metadata = {
  title: "Add an invitation",
  robots: { index: false, follow: false },
};
export default function NewInvitationPage() {
  return <AdminInvitationEditor />;
}
