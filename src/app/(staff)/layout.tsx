import { StaffHeader } from "@/modules/shared/components/staff-header";
import { InstallPrompt } from "@/modules/shared/components/install-prompt";
import { IosInstallGuide } from "@/modules/shared/components/ios-install-guide";

/** Layout for staff pages (gate check-in, kitchen and bar boards). Auth guard goes here. */
export default function StaffLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="group/staff flex min-h-dvh flex-col bg-surface-muted">
      <StaffHeader />
      {children}
      {/* Boards reserve the install rows to avoid shifts; centred panels drop empty rows so they sit mid-screen. */}
      <div className="group-has-[[data-centered-panel]]/staff:[&>div:empty]:hidden">
        <InstallPrompt />
        <IosInstallGuide />
      </div>
    </div>
  );
}
