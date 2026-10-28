import type { Metadata } from "next";
import { AdminAuthForm } from "@/modules/admin/components/admin-auth-form";
export const metadata: Metadata = {
  title: "Admin sign-out",
  robots: { index: false, follow: false },
};
export default function AdminSignOutPage() {
  return <AdminAuthForm signOut />;
}
