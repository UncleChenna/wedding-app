import type { Metadata } from "next";
import Link from "next/link";
import { RecoveryExport } from "@/modules/checkin/components/recovery-export";
export const metadata: Metadata = {
  title: "Recover gate records",
  robots: { index: false, follow: false },
};
export default function GateRecoveryPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 px-6 py-12">
      <h1 className="font-display text-4xl md:text-5xl">Recover gate records</h1>
      <RecoveryExport />
      <Link
        className="inline-flex min-h-11 items-center text-lg text-primary underline"
        href="/checkin"
      >
        Back to gate sign-in
      </Link>
    </main>
  );
}
