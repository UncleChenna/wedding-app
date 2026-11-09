import "server-only";
import { asc } from "drizzle-orm";
import { db } from "@/modules/shared/server/db/client";
import { invitations } from "@/modules/shared/server/db/schema";
import { currentStaff } from "@/modules/shared/server/staff-cookies";
import { credentialSnapshotResponse } from "./snapshot-response";

/** Live role/device/credential checks run even if the request passed the optimistic proxy. */
export function getCredentialSnapshotResponse() {
  return credentialSnapshotResponse({
    authorize: async () => (await currentStaff("gate")) !== null,
    load: async () => {
      const rows = await db
        .select({
          invitationId: invitations.id,
          tokenVersion: invitations.tokenVersion,
          status: invitations.status,
        })
        .from(invitations)
        .orderBy(asc(invitations.id));
      return { generatedAt: new Date().toISOString(), invitations: rows };
    },
  });
}
