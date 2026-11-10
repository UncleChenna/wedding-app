import "server-only";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/modules/shared/server/db/client";
import { guests, invitations, invitationLinkRequests } from "@/modules/shared/server/db/schema";
import { lostLinkRequestSchema, matchLostLinkRequest } from "@/modules/invitations/lib/lost-link";
import { requireAdminPageAccess } from "./current-admin-access";
import { getSharingInvitations } from "./sharing-invitations";

/** Contact data and bearer links must never be loaded before live admin authorization. */
export async function getLinkRequests(rawPage: unknown = "1") {
  await requireAdminPageAccess();
  const parsed = z.coerce.number().int().min(1).max(100000).safeParse(rawPage);
  const page = parsed.success ? parsed.data : 1;
  const rows = await db
    .select()
    .from(invitationLinkRequests)
    .orderBy(desc(invitationLinkRequests.createdAt), desc(invitationLinkRequests.id))
    .limit(51)
    .offset((page - 1) * 50);
  const candidates = await db
    .select({
      invitationId: guests.invitationId,
      name: guests.name,
      email: guests.email,
      phone: guests.phone,
      status: invitations.status,
    })
    .from(guests)
    .innerJoin(invitations, eq(guests.invitationId, invitations.id));
  const sharing = new Map((await getSharingInvitations()).map((item) => [item.id, item]));
  return {
    page,
    hasNext: rows.length > 50,
    requests: rows.slice(0, 50).map((row) => {
      const request = lostLinkRequestSchema.safeParse(row);
      const match = request.success ? matchLostLinkRequest(request.data, candidates) : null;
      return { ...row, invitation: match ? (sharing.get(match) ?? null) : null };
    }),
  };
}
