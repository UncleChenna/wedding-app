import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/modules/shared/server/db/client";
import { guests, invitations } from "@/modules/shared/server/db/schema";
import { invitationTokenSchema } from "../lib/token";
import { allocateInvitationToken } from "./allocate-token";
import { resolveInvitation } from "./resolve-invitation";

type InvitationDb = Pick<Db, "select" | "insert">;
const newInvitationSchema = z
  .object({
    householdName: z.string().trim().min(1).max(200),
    maxTagAlongs: z.number().int().min(0).max(10).default(1),
  })
  .strict();

/** Internal creation primitive; caller authorization belongs in the admin workflow. */
export async function createInvitation(db: InvitationDb, input: unknown) {
  const parsed = newInvitationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid_input" } as const;
  return allocateInvitationToken(async (token) => {
    const [saved] = await db
      .insert(invitations)
      .values({ ...parsed.data, token })
      .onConflictDoNothing({ target: invitations.token })
      .returning({ id: invitations.id, token: invitations.token });
    return saved ?? null;
  });
}

export async function findGuestInvitation(db: InvitationDb, token: unknown) {
  return resolveInvitation(token, async (validatedToken) => {
    const rows = await db
      .select({
        status: invitations.status,
        householdName: invitations.householdName,
        name: guests.name,
      })
      .from(invitations)
      .leftJoin(guests, and(eq(guests.invitationId, invitations.id), eq(guests.isPrimary, true)))
      .where(eq(invitations.token, validatedToken))
      .orderBy(asc(guests.createdAt), asc(guests.id));
    const first = rows[0];
    if (!first) return null;
    return {
      status: first.status,
      householdName: first.householdName,
      primaryNames: rows.flatMap((row) => (row.name === null ? [] : [row.name])),
    };
  });
}

/** Small pre-stream existence check; never fetch guest content in Proxy. */
export async function hasPublishedInvitation(db: InvitationDb, token: unknown): Promise<boolean> {
  const parsed = invitationTokenSchema.safeParse(token);
  if (!parsed.success) return false;
  const [row] = await db
    .select({ id: invitations.id })
    .from(invitations)
    .where(
      and(
        eq(invitations.token, parsed.data),
        inArray(invitations.status, ["sent", "rsvp_yes", "rsvp_no"]),
      ),
    )
    .limit(1);
  return row !== undefined;
}
