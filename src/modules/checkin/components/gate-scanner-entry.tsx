import { Suspense } from "react";
import { currentStaffDevice } from "@/modules/shared/server/staff-cookies";
import { staffSignOutAction } from "@/modules/shared/server/staff-actions";
import { StaffEntry } from "@/modules/shared/components/staff-entry";
import { PagePlaceholder } from "@/modules/shared/components/page-placeholder";
import { Button } from "@/modules/shared/components/ui/button";
import { appRoutes } from "@/modules/shared/lib/routes";
import { Scanner } from "./scanner";

async function Content() {
  const staff = await currentStaffDevice("gate");
  if (!staff) return <StaffEntry role="gate" />;
  return (
    <PagePlaceholder
      eyebrow="Staff"
      title="Gate check-in"
      description="Read a guest’s QR with this device’s camera."
      backTo={appRoutes.staff}
    >
      <p className="text-lg leading-relaxed">You’re signed in.</p>
      {staff.device.name && (
        <p className="text-lg leading-relaxed">
          This device is <span className="font-medium">{staff.device.name}</span>.
        </p>
      )}
      <Scanner />
      <form action={staffSignOutAction}>
        <Button size="lg" variant="secondary" type="submit">
          Sign out
        </Button>
      </form>
    </PagePlaceholder>
  );
}

export function GateScannerEntry() {
  return (
    <Suspense
      fallback={
        <PagePlaceholder
          eyebrow="Staff"
          title="Gate check-in"
          description="Getting your scanner ready…"
          backTo={appRoutes.staff}
        />
      }
    >
      <Content />
    </Suspense>
  );
}
