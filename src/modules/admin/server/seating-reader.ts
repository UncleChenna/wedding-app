import "server-only";
import { db } from "@/modules/shared/server/db/client";
import { createLogger } from "@/modules/shared/lib/logger";
import { requireAdminPageAccess } from "./current-admin-access";
import { readSeatingPlan } from "./seating-repository";
import type { SeatingPlan } from "../lib/seating";

export async function getSeatingPlan(): Promise<
  { ok: true; plan: SeatingPlan } | { ok: false; message: string }
> {
  await requireAdminPageAccess();
  try {
    return { ok: true, plan: await readSeatingPlan(db) };
  } catch {
    createLogger({ module: "seating" }).warn("Seating plan unavailable");
    return { ok: false, message: "Your seating plan couldn't load. Please try again shortly." };
  }
}
