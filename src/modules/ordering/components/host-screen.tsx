import { Suspense } from "react";
import { connection } from "next/server";
import { StaffEntry } from "@/modules/shared/components/staff-entry";
import { Button } from "@/modules/shared/components/ui/button";
import { createLogger } from "@/modules/shared/lib/logger";
import { db } from "@/modules/shared/server/db/client";
import { staffSignOutAction } from "@/modules/shared/server/staff-actions";
import { currentStaffDevice } from "@/modules/shared/server/staff-cookies";
import type { HostBoard as Board } from "../lib/host-board";
import { readHostBoard } from "../server/host-board";
import { HostBoard } from "./host-board";

const log = createLogger({ module: "host-board" });

async function HostScreenContent() {
  await connection();
  let staffId: string | null = null;
  try {
    staffId = (await currentStaffDevice("host"))?.identity.staffId ?? null;
  } catch {
    log.warn("staff session unavailable");
  }
  if (!staffId) return <StaffEntry role="host" />;

  let initial: Board;
  try {
    initial = await readHostBoard(db, staffId);
  } catch {
    log.warn("Host board unavailable");
    initial = { generatedAt: new Date().toISOString(), tables: [], tickets: [] };
  }
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-lg font-medium tracking-widest text-muted-foreground uppercase">
            Table host
          </p>
          <h1 className="font-display text-4xl leading-tight md:text-5xl">Your tables</h1>
          <p className="mt-2 text-lg leading-relaxed">
            {initial.tables.length === 0
              ? "No tables yet. Ask the coordinator to assign yours."
              : `Tables ${initial.tables.map((table) => table.number).join(", ")}`}
          </p>
        </div>
        <form action={staffSignOutAction}>
          <Button type="submit" variant="ghost" size="lg">
            Sign out
          </Button>
        </form>
      </div>
      <HostBoard initial={initial} />
    </main>
  );
}

/** /host: a table host's PIN sign-in, then the open orders for their tables (TICKET-082). */
export function HostScreen() {
  return (
    <Suspense fallback={<StaffEntry role="host" />}>
      <HostScreenContent />
    </Suspense>
  );
}
