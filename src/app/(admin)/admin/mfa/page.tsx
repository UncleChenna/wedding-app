import type { Metadata } from "next";
import { Suspense } from "react";
import { MfaEntry } from "@/modules/admin/components/mfa-entry";
export const metadata: Metadata = {
  title: "Two-step sign-in",
  robots: { index: false, follow: false },
};
export default function MfaPage() {
  return (
    <Suspense
      fallback={<main className="p-6 text-lg leading-relaxed">Checking your sign-in…</main>}
    >
      <MfaEntry />
    </Suspense>
  );
}
