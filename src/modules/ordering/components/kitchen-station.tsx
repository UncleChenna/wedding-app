import { Suspense } from "react";
import { connection } from "next/server";
import { StaffEntry } from "@/modules/shared/components/staff-entry";
import { createLogger } from "@/modules/shared/lib/logger";
import { db } from "@/modules/shared/server/db/client";
import { currentStaff } from "@/modules/shared/server/staff-cookies";
import { staffSignOutAction } from "@/modules/shared/server/staff-actions";
import { Button } from "@/modules/shared/components/ui/button";
import type { KitchenBoard as Board } from "../lib/station-board";
import { readKitchenBoard } from "../server/station-board";
import { KitchenBoard } from "./kitchen-board";

const log = createLogger({ module: "kitchen-board" });

async function KitchenStationContent() {
  await connection();
  let signedIn = false;
  try {
    signedIn = (await currentStaff("kitchen")) !== null;
  } catch {
    log.warn("staff session unavailable");
  }
  // Signed out (or the check failed): the shared PIN sign-in, exactly as before.
  if (!signedIn) return <StaffEntry role="kitchen" />;

  let initial: Board;
  try {
    initial = await readKitchenBoard(db);
  } catch {
    log.warn("Kitchen board unavailable");
    initial = { generatedAt: new Date().toISOString(), tickets: [] };
  }
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
            Staff
          </p>
          <h1 className="font-display text-4xl leading-tight md:text-5xl">Kitchen board</h1>
        </div>
        <form action={staffSignOutAction}>
          <Button type="submit" variant="ghost" size="lg">
            Sign out
          </Button>
        </form>
      </div>
      <KitchenBoard initial={initial} />
    </main>
  );
}

/** /kitchen: the PIN sign-in, then the live board (ORD-4, TICKET-076). */
export function KitchenStation() {
  return (
    <Suspense fallback={<StaffEntry role="kitchen" />}>
      <KitchenStationContent />
    </Suspense>
  );
}
