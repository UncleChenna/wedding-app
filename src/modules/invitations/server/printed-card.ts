import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/modules/shared/server/db/client";
import { guests, invitations } from "@/modules/shared/server/db/schema";
import { clientEnv } from "@/modules/shared/lib/env/client";
import { invitationTokenSchema } from "../lib/token";
import type { PrintedCardDetails } from "../lib/printed-card";

export type PersonalCard = PrintedCardDetails & { rsvpUrl: string; status: string };

function assemble(
  rows: {
    cardNumber: number;
    householdName: string | null;
    name: string | null;
    maxTagAlongs: number;
    token: string;
    status: string;
  }[],
): PersonalCard | null {
  const first = rows[0];
  if (!first) return null;
  const names = rows.flatMap((row) => (row.name ? [row.name] : []));
  return {
    cardNumber: first.cardNumber,
    guestName: first.householdName || names.join(" & ") || "Our dear guest",
    capacity: Math.max(1, rows.filter((row) => row.name !== null).length) + first.maxTagAlongs,
    rsvpUrl: new URL(`/i/${encodeURIComponent(first.token)}#reply`, clientEnv.NEXT_PUBLIC_SITE_URL)
      .href,
    status: first.status,
  };
}

async function readCard(where: ReturnType<typeof eq>) {
  return assemble(
    await db
      .select({
        cardNumber: invitations.cardNumber,
        householdName: invitations.householdName,
        name: guests.name,
        maxTagAlongs: invitations.maxTagAlongs,
        token: invitations.token,
        status: invitations.status,
      })
      .from(invitations)
      .leftJoin(guests, and(eq(guests.invitationId, invitations.id), eq(guests.isPrimary, true)))
      .where(where)
      .orderBy(asc(guests.createdAt), asc(guests.id)),
  );
}

export async function readGuestCard(token: unknown) {
  const parsed = invitationTokenSchema.safeParse(token);
  if (!parsed.success) return null;
  const card = await readCard(eq(invitations.token, parsed.data));
  return card && ["sent", "rsvp_yes", "rsvp_no"].includes(card.status) ? card : null;
}

/** Caller must require admin authorization before resolving a database ID. */
export async function readAdminCard(id: unknown) {
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return null;
  const card = await readCard(eq(invitations.id, parsed.data));
  return card?.status === "revoked" ? null : card;
}
