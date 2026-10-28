import type { Metadata } from "next";
import { AdminAuthForm } from "@/modules/admin/components/admin-auth-form";
export const metadata: Metadata = {
  title: "Admin sign-in",
  robots: { index: false, follow: false },
};
export default function AdminSignInPage() {
  return <AdminAuthForm />;
}
