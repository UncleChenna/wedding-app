import { InstallPrompt } from "@/modules/shared/components/install-prompt";
import { IosInstallGuide } from "@/modules/shared/components/ios-install-guide";

/** Layout for staff pages (gate check-in, kitchen and bar boards). Auth guard goes here. */
export default function StaffLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface-muted">
      {children}
      <InstallPrompt />
      <IosInstallGuide />
    </div>
  );
}
