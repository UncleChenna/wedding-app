import type { Metadata } from "next";
import { AdminShellPreview } from "@/modules/admin/components/admin-shell-preview";
export const metadata: Metadata = { title: "Admin shell preview", robots: { index: false } };
export default function AdminShellPreviewPage() {
  return <AdminShellPreview />;
}
