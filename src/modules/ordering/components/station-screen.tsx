import { Suspense } from "react";
import { connection } from "next/server";
import { StaffEntry } from "@/modules/shared/components/staff-entry";
import { createLogger } from "@/modules/shared/lib/logger";
import { db } from "@/modules/shared/server/db/client";
import { currentStaffDevice } from "@/modules/shared/server/staff-cookies";
import { staffSignOutAction } from "@/modules/shared/server/staff-actions";
import { Button } from "@/modules/shared/components/ui/button";
import type { BoardStation, StationBoard as Board } from "../lib/station-board";
import { readStationBoard } from "../server/station-board";
import { StationBoard } from "./station-board";

const log = createLogger({ module: "station-board" });
const titles = { kitchen: "Kitchen board", bar: "Bar board" } as const;

async function StationScreenContent({ station }: { station: BoardStation }) {
  await connection();
  let signedIn = false;
  let deviceName: string | null = null;
  try {
    const current = await currentStaffDevice(station);
    signedIn = current !== null;
    deviceName = current?.device.name ?? null;
  } catch {
    log.warn("staff session unavailable");
  }
  // Signed out (or the check failed): the shared PIN sign-in, exactly as before.
  if (!signedIn) return <StaffEntry role={station} />;

  let initial: Board;
  try {
    initial = await readStationBoard(db, station);
  } catch {
    log.warn("Station board unavailable", { station });
    initial = { generatedAt: new Date().toISOString(), tickets: [], recent: [] };
  }
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
            Staff
          </p>
          <h1 className="font-display text-4xl leading-tight md:text-5xl">{titles[station]}</h1>
          <p className="mt-2 text-lg leading-relaxed" role="status">
            You’re signed in.
          </p>
          {deviceName ? (
            <p className="text-lg leading-relaxed">
              This device is <span className="font-medium">{deviceName}</span>.
            </p>
          ) : null}
        </div>
        <form action={staffSignOutAction}>
          <Button type="submit" variant="ghost" size="lg">
            Sign out
          </Button>
        </form>
      </div>
      <StationBoard station={station} initial={initial} />
    </main>
  );
}

/** /kitchen and /bar: the station's PIN sign-in, then its live board (ORD-4, TICKET-076/077). */
export function StationScreen({ station }: { station: BoardStation }) {
  return (
    <Suspense fallback={<StaffEntry role={station} />}>
      <StationScreenContent station={station} />
    </Suspense>
  );
}
