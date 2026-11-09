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
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-6">
      <header className="flex flex-col gap-3">
        <h1 className="font-display text-4xl leading-tight">Gate check-in</h1>
        <p className="text-lg leading-relaxed text-muted-foreground">
          Read a guest’s QR with this device’s camera.
        </p>
        <p className="text-lg leading-relaxed">
          <span>You’re signed in.</span>
          {staff.device.name && (
            <>
              {" "}
              Device: <span className="font-medium">{staff.device.name}</span>.
            </>
          )}
        </p>
      </header>
      <Scanner />
      <form action={staffSignOutAction}>
        <Button size="lg" variant="secondary" type="submit">
          Sign out
        </Button>
      </form>
    </main>
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
