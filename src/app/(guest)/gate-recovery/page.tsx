import type { Metadata } from "next";
import Link from "next/link";
import { RecoveryExport } from "@/modules/checkin/components/recovery-export";
import { CenteredPanel, panelLinkClassName } from "@/modules/shared/components/ui/centered-panel";
export const metadata: Metadata = {
  title: "Recover gate records",
  robots: { index: false, follow: false },
};
export default function GateRecoveryPage() {
  return (
    <CenteredPanel
      variant="staff"
      eyebrow="Gate team"
      title="Recover gate records"
      footer={
        <Link className={panelLinkClassName} href="/checkin">
          Back to gate sign-in
        </Link>
      }
    >
      <RecoveryExport />
    </CenteredPanel>
  );
}
