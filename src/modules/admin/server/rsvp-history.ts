import "server-only";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/modules/shared/server/db/client";
import { invitations, rsvpChanges } from "@/modules/shared/server/db/schema";
import { createLogger } from "@/modules/shared/lib/logger";
import { historyActor, historySnapshot, type RsvpHistoryEntry } from "../lib/rsvp-history-view";
import { requireAdminPageAccess } from "./current-admin-access";
export type RsvpHistoryResult =
  | { status: "ready"; name: string; entries: RsvpHistoryEntry[] }
  | { status: "not-found" }
  | { status: "error"; message: string };
export async function getRsvpHistory(id: string): Promise<RsvpHistoryResult> {
  await requireAdminPageAccess();
  if (!z.uuid().safeParse(id).success) return { status: "not-found" };
  try {
    return await db.transaction(
      async (tx): Promise<RsvpHistoryResult> => {
        const [invitation] = await tx
          .select({ householdName: invitations.householdName })
          .from(invitations)
          .where(eq(invitations.id, id));
        if (!invitation) return { status: "not-found" };
        const rows = await tx
          .select({
            id: rsvpChanges.id,
            changedAt: rsvpChanges.changedAt,
            actor: rsvpChanges.actor,
            before: rsvpChanges.before,
            after: rsvpChanges.after,
          })
          .from(rsvpChanges)
          .where(eq(rsvpChanges.invitationId, id))
          .orderBy(desc(rsvpChanges.changedAt), desc(rsvpChanges.id));
        return {
          status: "ready",
          name: invitation.householdName || "Invitation",
          entries: rows.map((row) => ({
            id: row.id,
            changedAt: row.changedAt.toISOString(),
            actor: historyActor(row.actor),
            before: historySnapshot(row.before),
            after: historySnapshot(row.after),
          })),
        };
      },
      { isolationLevel: "repeatable read", accessMode: "read only" },
    );
  } catch {
    createLogger({ module: "admin-rsvp-history" }).warn("RSVP history read unavailable");
    return { status: "error", message: "The reply history couldn't load. Please try again." };
  }
}
