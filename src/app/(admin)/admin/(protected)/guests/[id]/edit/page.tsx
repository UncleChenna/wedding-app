import type { Metadata } from "next";
import { AdminInvitationEditor } from "@/modules/admin/components/admin-invitation-editor";
export const metadata: Metadata = {
  title: "Edit invitation",
  robots: { index: false, follow: false },
};
export default async function EditInvitationPage({ params }: { params: Promise<{ id: string }> }) {
  return <AdminInvitationEditor id={(await params).id} />;
}
