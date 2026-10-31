import { Suspense, type ReactNode } from "react";
import { AdminAccessGate } from "@/modules/admin/components/admin-access-gate";
export default function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={<main className="p-6 text-lg leading-relaxed">Checking your sign-in…</main>}
    >
      <AdminAccessGate>{children}</AdminAccessGate>
    </Suspense>
  );
}
