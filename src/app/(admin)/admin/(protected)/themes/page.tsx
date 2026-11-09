import type { Metadata } from "next";
import { AdminThemes } from "@/modules/admin/components/admin-themes";
export const metadata: Metadata = {
  title: "Theme studio",
  robots: { index: false, follow: false },
};
export default function ThemeEditorPage() {
  return <AdminThemes />;
}
