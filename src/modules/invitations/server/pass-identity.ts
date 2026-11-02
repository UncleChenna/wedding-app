import "server-only";
import { eq } from "drizzle-orm";
import type { Db } from "@/modules/shared/server/db/client";
import { invitations } from "@/modules/shared/server/db/schema";
import { invitationTokenSchema } from "../lib/token";

type RecordIdentity = { id: string; status: string; tokenVersion: number };

/** Resolve the private editing credential; never accept a caller-supplied database ID. */
export async function resolvePassIdentity(
  token: unknown,
  find: (token: string) => Promise<RecordIdentity | null>,
): Promise<{ id: string; tokenVersion: number } | null> {
  const parsed = invitationTokenSchema.safeParse(token);
  if (!parsed.success) return null;
  const record = await find(parsed.data);
  return record?.status === "rsvp_yes"
    ? { id: record.id, tokenVersion: record.tokenVersion }
    : null;
}

export function findInvitationPassIdentity(db: Pick<Db, "select">, token: unknown) {
  return resolvePassIdentity(token, async (credential) => {
    const [row] = await db
      .select({
        id: invitations.id,
        status: invitations.status,
        tokenVersion: invitations.tokenVersion,
      })
      .from(invitations)
      .where(eq(invitations.token, credential))
      .limit(1);
    return row ?? null;
  });
}
